import { prisma } from "../config/db.js";
import { AiChatError } from "./ai.errors.js";
import type { AiAction, AssignTicketsActionResult } from "./ai.types.js";
import {
  MAX_ASSIGNMENTS_PER_REQUEST,
  MAX_BATCH_CREATE_ITEMS,
} from "./ai.tools.js";
import {
  createProjectBoardColumn,
  deleteProjectBoardColumn,
  isBacklogColumnName,
} from "../services/boardColumn.service.js";
import {
  addLabelsToTickets,
  assignOrReassignTickets,
  createTicket as createTicketService,
  moveTicketsToColumn,
  removeLabelsFromTickets,
} from "../services/ticket.service.js";
import { assertValidTicketBulkSelector } from "../utils/ticketBulkSelector.utils.js";
import { ApiError } from "../utils/apiResponse.js";
import {
  createOrGetProjectLabel,
  deleteProjectLabelByName,
} from "../services/project.service.js";
import {
  describeTicketBulkSelector,
  resolveTicketsForBulkSelector,
} from "../utils/ticketBulkSelector.utils.js";
import { createIssueType as createIssueTypeService } from "../services/ticketType.service.js";

type ToolContext = {
  userId: string;
  orgId: string;
  projectId: string;
  timeZone: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves a list of raw assignee entries (each "current_user", "unassigned",
 * or an email address) into a deduplicated list of user IDs / "unassigned".
 *
 * Fails loudly and specifically:
 * - If any entry isn't a recognizable keyword/email (e.g. a bare name), the
 *   whole request is rejected, naming the offending entries.
 * - If any email doesn't belong to a project member, the whole request is
 *   rejected, naming exactly which email(s) are invalid.
 */
async function resolveAssignees(
  assignees: string[],
  ctx: ToolContext,
): Promise<string[]> {
  const resolved = new Set<string>();
  const unrecognized: string[] = [];
  const emailsToLookup: string[] = [];

  for (const raw of assignees) {
    const value = raw.trim();
    if (!value) continue;

    if (value === "current_user") {
      resolved.add(ctx.userId);
      continue;
    }

    if (value === "unassigned") {
      resolved.add("unassigned");
      continue;
    }

    if (!EMAIL_PATTERN.test(value)) {
      unrecognized.push(raw);
      continue;
    }

    emailsToLookup.push(value);
  }

  if (unrecognized.length > 0) {
    const list = unrecognized.map((v) => `"${v}"`).join(", ");
    throw new AiChatError(
      `To filter by another user's tickets, please provide their email address rather than a name. Could not recognize: ${list}.`,
    );
  }

  if (emailsToLookup.length > 0) {
    const members = await prisma.projectMember.findMany({
      where: { projectId: ctx.projectId },
      select: { userId: true, user: { select: { email: true } } },
    });

    const membersByEmail = new Map(
      members.map((m) => [m.user.email.toLowerCase(), m.userId]),
    );

    const notFound = emailsToLookup.filter(
      (email) => !membersByEmail.has(email.toLowerCase()),
    );

    if (notFound.length > 0) {
      const list = notFound.map((e) => `"${e}"`).join(", ");
      throw new AiChatError(
        notFound.length === 1
          ? `${list} doesn't belong to this project. Please re-check the entered email.`
          : `These emails don't belong to this project: ${list}. Please re-check them.`,
      );
    }

    for (const email of emailsToLookup) {
      resolved.add(membersByEmail.get(email.toLowerCase())!);
    }
  }

  return Array.from(resolved);
}

type AssignTarget = { id: string; username: string };

const CURRENT_USER = "current_user";

const assignTargetKey = (raw: string) => {
  const value = raw.trim();
  return value === CURRENT_USER ? CURRENT_USER : value.toLowerCase();
};

async function resolveAssignTargets(
  rawAssignees: string[],
  ctx: ToolContext,
): Promise<{
  targets: Map<string, AssignTarget>;
  rejections: Map<string, string>;
}> {
  const members = await prisma.projectMember.findMany({
    where: { projectId: ctx.projectId },
    select: {
      role: true,
      user: { select: { id: true, username: true, email: true } },
    },
  });

  const membersByEmail = new Map(
    members.map((m) => [m.user.email.toLowerCase(), m]),
  );
  const self = members.find((m) => m.user.id === ctx.userId);

  const targets = new Map<string, AssignTarget>();
  const rejections = new Map<string, string>();

  for (const raw of rawAssignees) {
    const value = raw.trim();
    const key = assignTargetKey(raw);
    if (targets.has(key) || rejections.has(key)) continue;

    if (key !== CURRENT_USER && !EMAIL_PATTERN.test(value)) {
      rejections.set(
        key,
        `"${value}" isn't an email address. Please provide the person's email`,
      );
      continue;
    }

    const member = key === CURRENT_USER ? self : membersByEmail.get(key);

    if (!member) {
      rejections.set(
        key,
        key === CURRENT_USER
          ? "You are not a member of this project"
          : `"${value}" doesn't belong to this project. Please re-check the entered email`,
      );
    } else if (member.role === "VIEWER") {
      rejections.set(
        key,
        `${member.user.username} has view-only access and can't be assigned tickets`,
      );
    } else {
      targets.set(key, { id: member.user.id, username: member.user.username });
    }
  }

  return { targets, rejections };
}

export async function executeFilterBoard(
  args: {
    query?: string;
    assignees?: string[];
    priority?: string;
    type?: string;
    labels?: string[];
  },
  ctx: ToolContext,
): Promise<AiAction> {
  const boardFilters: AiAction & { type: "navigate_board" } = {
    type: "navigate_board",
    filters: {},
  };

  if (args.query) boardFilters.filters.query = args.query;

  if (args.assignees?.length) {
    boardFilters.filters.assignee = await resolveAssignees(args.assignees, ctx);
  }

  if (args.priority) boardFilters.filters.priority = args.priority;

  if (args.type) {
    const issueType = await prisma.issueType.findFirst({
      where: { projectId: ctx.projectId, key: args.type.toLowerCase() },
      select: { id: true },
    });
    if (issueType) boardFilters.filters.type = issueType.id;
  }

  if (args.labels?.length) {
    const labels = await prisma.label.findMany({
      where: {
        projectId: ctx.projectId,
        name: { in: args.labels.map((l) => l.toLowerCase()) },
      },
      select: { id: true },
    });
    if (labels.length > 0) {
      boardFilters.filters.labels = labels.map((l) => l.id);
    }
  }

  return boardFilters;
}

export async function executeCreateIssueType(
  args: { key: string; color: string },
  ctx: ToolContext,
): Promise<AiAction> {
  const newType = await createIssueTypeService(
    ctx.orgId,
    ctx.userId,
    ctx.projectId,
    args,
  );

  return {
    type: "create_issue_type",
    issueType: {
      id: newType.id,
      key: newType.key,
      color: newType.color,
    },
  };
}

export async function executeCreateTicket(
  args: {
    title: string;
    priority?: string;
    type?: string;
    columnName?: string;
    assignee?: string;
  },
  ctx: ToolContext,
): Promise<{
  action: Extract<AiAction, { type: "create_ticket" }>;
  assignment?: Extract<AiAction, { type: "assign_tickets" }>;
}> {
  let typeId: string | undefined;

  if (args.type) {
    const issueType = await prisma.issueType.findFirst({
      where: { projectId: ctx.projectId, key: args.type.toLowerCase() },
      select: { id: true },
    });
    if (issueType) typeId = issueType.id;
  }

  const ticket = await createTicketService(ctx.orgId, ctx.userId, {
    projectId: ctx.projectId,
    columnName:
      (args.columnName as
        | "backlog"
        | "todo"
        | "in_progress"
        | "in_review"
        | "done"
        | undefined) ?? "todo",
    title: args.title,
    priority: args.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined,
    typeId,
  });

  const action = {
    type: "create_ticket" as const,
    ticket: {
      id: ticket.id,
      ticketKey: ticket.ticketKey,
      title: ticket.title,
      columnId: ticket.columnId,
    },
  };

  if (!args.assignee?.trim()) return { action };

  const assignment = (await executeAssignTickets(
    {
      assignments: [
        { assignee: args.assignee, ticketKeys: [ticket.ticketKey] },
      ],
    },
    ctx,
  )) as Extract<AiAction, { type: "assign_tickets" }>;

  return { action, assignment };
}

const batchItemErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof AiChatError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

const assertBatchLength = (length: number, itemName: string) => {
  if (length < 1) {
    throw new AiChatError(`Provide at least one ${itemName}.`);
  }
  if (length > MAX_BATCH_CREATE_ITEMS) {
    throw new AiChatError(
      `You can create at most ${MAX_BATCH_CREATE_ITEMS} ${itemName} at once.`,
    );
  }
};

async function createLabelAction(
  args: { name: string; color?: string },
  ctx: ToolContext,
): Promise<Extract<AiAction, { type: "create_label" }>> {
  const label = await createOrGetProjectLabel(
    ctx.orgId,
    ctx.userId,
    ctx.projectId,
    args,
  );

  return {
    type: "create_label",
    label: { id: label.id, name: label.name, color: label.color },
    alreadyExisted: label.alreadyExisted,
  };
}

export async function executeCreateLabels(
  args: {
    labels?: { name: string; color?: string }[];
    name?: string;
    color?: string;
  },
  ctx: ToolContext,
): Promise<{
  actions: Extract<AiAction, { type: "create_label" }>[];
  errors: string[];
}> {
  const labels =
    args.labels ??
    (args.name ? [{ name: args.name, color: args.color }] : undefined);

  if (!labels?.length) {
    throw new AiChatError("Provide a labels array with at least one name.");
  }

  assertBatchLength(labels.length, "labels");

  const actions: Extract<AiAction, { type: "create_label" }>[] = [];
  const errors: string[] = [];

  for (const label of labels) {
    try {
      actions.push(await createLabelAction(label, ctx));
    } catch (error) {
      errors.push(`"${label.name}": ${batchItemErrorMessage(error)}`);
    }
  }

  if (actions.length === 0 && errors.length > 0) {
    throw new AiChatError(errors.join("; "));
  }

  return { actions, errors };
}

export async function executeCreateIssueTypes(
  args: {
    issueTypes?: { key: string; color: string }[];
    key?: string;
    color?: string;
  },
  ctx: ToolContext,
): Promise<{
  actions: Extract<AiAction, { type: "create_issue_type" }>[];
  errors: string[];
}> {
  const issueTypes =
    args.issueTypes ??
    (args.key && args.color
      ? [{ key: args.key, color: args.color }]
      : undefined);

  if (!issueTypes?.length) {
    throw new AiChatError(
      "Provide an issueTypes array with at least one key and color.",
    );
  }

  assertBatchLength(issueTypes.length, "issue types");

  const actions: Extract<AiAction, { type: "create_issue_type" }>[] = [];
  const errors: string[] = [];

  for (const issueType of issueTypes) {
    try {
      actions.push(
        (await executeCreateIssueType(issueType, ctx)) as Extract<
          AiAction,
          { type: "create_issue_type" }
        >,
      );
    } catch (error) {
      errors.push(`"${issueType.key}": ${batchItemErrorMessage(error)}`);
    }
  }

  if (actions.length === 0 && errors.length > 0) {
    throw new AiChatError(errors.join("; "));
  }

  return { actions, errors };
}

const findBoardColumnByName = async (projectId: string, columnName: string) =>
  prisma.boardColumn.findFirst({
    where: {
      projectId,
      name: { equals: columnName.trim(), mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { tickets: true } },
    },
  });

export type DeleteBoardColumnEntry = {
  columnName: string;
  ticketDisposition?: "move" | "delete_all";
  moveToColumnName?: string;
};

export const normalizeDeleteBoardColumnArgs = (args: {
  columns?: DeleteBoardColumnEntry[];
  columnName?: string;
  ticketDisposition?: "move" | "delete_all";
  moveToColumnName?: string;
}): DeleteBoardColumnEntry[] => {
  if (args.columns?.length) return args.columns;

  const single = args.columnName?.trim();
  if (single) {
    return [
      {
        columnName: single,
        ticketDisposition: args.ticketDisposition,
        moveToColumnName: args.moveToColumnName,
      },
    ];
  }

  return [];
};

export async function executeDeleteBoardColumns(
  args: {
    columns?: DeleteBoardColumnEntry[];
    columnName?: string;
    ticketDisposition?: "move" | "delete_all";
    moveToColumnName?: string;
  },
  ctx: ToolContext,
): Promise<{
  actions: Extract<AiAction, { type: "delete_board_column" }>[];
  errors: string[];
}> {
  const columns = normalizeDeleteBoardColumnArgs(args);

  if (!columns.length) {
    throw new AiChatError(
      "Provide columnName (one column) or a columns array with columnName entries.",
    );
  }

  assertBatchLength(columns.length, "board columns");

  const actions: Extract<AiAction, { type: "delete_board_column" }>[] = [];
  const errors: string[] = [];

  for (const entry of columns) {
    try {
      const column = await findBoardColumnByName(
        ctx.projectId,
        entry.columnName,
      );

      if (!column) {
        errors.push(
          `Column "${entry.columnName}": no board column with that name exists`,
        );
        continue;
      }

      if (isBacklogColumnName(column.name)) {
        errors.push(`Column "${column.name}": Backlog cannot be deleted`);
        continue;
      }

      const ticketCount = column._count.tickets;
      let deleteOptions: {
        ticketDisposition?: "move" | "delete_all";
        targetColumnId?: string;
      } = {};

      if (ticketCount > 0) {
        if (!entry.ticketDisposition) {
          throw new AiChatError(
            `Column "${column.name}" has ${ticketCount} ticket${ticketCount === 1 ? "" : "s"}. ` +
              `Ask the user whether to move them to another column (ticketDisposition "move" with moveToColumnName) ` +
              `or delete those tickets with the column (ticketDisposition "delete_all").`,
          );
        }

        if (entry.ticketDisposition === "move") {
          const targetName = entry.moveToColumnName?.trim();
          if (!targetName) {
            throw new AiChatError(
              `Column "${column.name}": moveToColumnName is required when ticketDisposition is "move".`,
            );
          }

          const target = await findBoardColumnByName(ctx.projectId, targetName);

          if (!target) {
            errors.push(
              `Column "${entry.columnName}": move target "${targetName}" was not found`,
            );
            continue;
          }

          deleteOptions = {
            ticketDisposition: "move",
            targetColumnId: target.id,
          };
        } else {
          deleteOptions = { ticketDisposition: "delete_all" };
        }
      }

      const result = await deleteProjectBoardColumn(
        ctx.orgId,
        ctx.userId,
        ctx.projectId,
        column.id,
        deleteOptions,
      );

      actions.push({
        type: "delete_board_column",
        column: { name: column.name },
        ticketsAffected: ticketCount,
        restoredDefaultColumns: result.restoredDefaultColumns,
      });
    } catch (error) {
      errors.push(`"${entry.columnName}": ${batchItemErrorMessage(error)}`);
    }
  }

  if (actions.length === 0 && errors.length > 0) {
    throw new AiChatError(errors.join("; "));
  }

  return { actions, errors };
}

export async function executeCreateBoardColumns(
  args: { columns: { name: string; color?: string }[] },
  ctx: ToolContext,
): Promise<{
  actions: Extract<AiAction, { type: "create_board_column" }>[];
  errors: string[];
}> {
  const columns = args.columns;

  if (!columns?.length) {
    throw new AiChatError("Provide a columns array with at least one name.");
  }

  assertBatchLength(columns.length, "board columns");

  const actions: Extract<AiAction, { type: "create_board_column" }>[] = [];
  const errors: string[] = [];

  for (const column of columns) {
    try {
      const created = await createProjectBoardColumn(
        ctx.orgId,
        ctx.userId,
        ctx.projectId,
        column,
      );

      actions.push({
        type: "create_board_column",
        column: {
          id: created.id,
          name: created.name,
          color: created.color,
        },
        alreadyExisted: created.alreadyExisted,
      });
    } catch (error) {
      errors.push(`"${column.name}": ${batchItemErrorMessage(error)}`);
    }
  }

  if (actions.length === 0 && errors.length > 0) {
    throw new AiChatError(errors.join("; "));
  }

  return { actions, errors };
}

type TicketSelectorArg = {
  ticketKeys?: string[];
  allTickets?: boolean;
  date?: string;
  dateRange?: { from: string; to: string };
  withLabels?: string[];
  onlyUnassigned?: boolean;
};

const withSelectorContext = (
  selector: TicketSelectorArg,
  ctx: ToolContext,
) => ({
  ...selector,
  timeZone: ctx.timeZone,
});

export async function executeApplyLabels(
  args: TicketSelectorArg & { labels: string[] },
  ctx: ToolContext,
): Promise<AiAction> {
  const result = await addLabelsToTickets(ctx.orgId, ctx.userId, {
    projectId: ctx.projectId,
    labelNames: args.labels ?? [],
    ...withSelectorContext(args, ctx),
  });

  return {
    type: "apply_labels",
    labels: result.labels,
    labeled: result.labeled,
    skipped: result.skipped,
  };
}

export async function executeRemoveLabels(
  args: TicketSelectorArg & { labels: string[] },
  ctx: ToolContext,
): Promise<AiAction> {
  const result = await removeLabelsFromTickets(ctx.orgId, ctx.userId, {
    projectId: ctx.projectId,
    labelNames: args.labels ?? [],
    ...withSelectorContext(args, ctx),
  });

  return {
    type: "remove_labels",
    labels: result.labels,
    updated: result.updated,
    skipped: result.skipped,
  };
}

export async function executeDeleteLabel(
  args: { name: string },
  ctx: ToolContext,
): Promise<AiAction> {
  const labelName = args.name?.trim();
  if (!labelName) {
    throw new AiChatError("Provide the label name to delete.");
  }

  const matchingColumn = await findBoardColumnByName(ctx.projectId, labelName);

  if (matchingColumn) {
    throw new AiChatError(
      `"${matchingColumn.name}" is a board column (stage), not a label. ` +
        `Use delete_board_column with columnName "${matchingColumn.name}" instead.`,
    );
  }

  const result = await deleteProjectLabelByName(
    ctx.orgId,
    ctx.userId,
    ctx.projectId,
    labelName,
  );

  return {
    type: "delete_label",
    label: {
      name: result.name,
      ticketsAffected: result.ticketsAffected,
    },
  };
}

export async function executeMoveTickets(
  args: TicketSelectorArg & { columnName: string },
  ctx: ToolContext,
): Promise<AiAction> {
  const result = await moveTicketsToColumn(ctx.orgId, ctx.userId, {
    projectId: ctx.projectId,
    columnName: args.columnName,
    ...withSelectorContext(args, ctx),
  });

  return {
    type: "move_tickets",
    columnName: result.columnName,
    moved: result.moved,
    skipped: result.skipped,
  };
}

type AssignmentArg = TicketSelectorArg & {
  assignee: string;
};

const describeAssignmentTickets = (assignment: AssignmentArg): string[] =>
  describeTicketBulkSelector(assignment);

export async function executeAssignTickets(
  args: { assignments: AssignmentArg[] },
  ctx: ToolContext,
): Promise<AiAction> {
  const assignments = args.assignments ?? [];

  if (assignments.length === 0) {
    throw new AiChatError(
      'Tell me which tickets to assign and to whom, e.g. "assign TB-1 to jane@company.com".',
    );
  }

  if (assignments.length > MAX_ASSIGNMENTS_PER_REQUEST) {
    throw new AiChatError(
      `I can assign to at most ${MAX_ASSIGNMENTS_PER_REQUEST} people in one request. Please split it up.`,
    );
  }

  const { targets, rejections } = await resolveAssignTargets(
    assignments.map((a) => a.assignee ?? ""),
    ctx,
  );

  const skipped: { ticketKey: string; reason: string }[] = [];
  const runnable: { assignment: AssignmentArg; target: AssignTarget }[] = [];

  for (const assignment of assignments) {
    const key = assignTargetKey(assignment.assignee ?? "");
    const target = targets.get(key);

    let rejection = rejections.get(key);

    if (!rejection) {
      try {
        assertValidTicketBulkSelector({
          ...assignment,
          timeZone: ctx.timeZone,
        });
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        rejection = error.message;
      }
    }

    if (rejection || !target) {
      for (const ticketKey of describeAssignmentTickets(assignment)) {
        skipped.push({
          ticketKey,
          reason: rejection ?? "Could not resolve the assignee",
        });
      }
      continue;
    }

    runnable.push({ assignment, target });
  }

  const assigneeByTicketId = new Map<string, string>();

  for (const { assignment, target } of runnable) {
    const { tickets } = await resolveTicketsForBulkSelector(
      ctx.projectId,
      withSelectorContext(assignment, ctx),
    );

    for (const ticket of tickets) {
      const existingTarget = assigneeByTicketId.get(ticket.id);

      if (existingTarget && existingTarget !== target.id) {
        throw new AiChatError(
          `${ticket.ticketKey} is listed for more than one person. A ticket can only be assigned to one person at a time.`,
        );
      }

      assigneeByTicketId.set(ticket.id, target.id);
    }
  }

  const results: AssignTicketsActionResult[] = [];

  for (const { assignment, target } of runnable) {
    const result = await assignOrReassignTickets(ctx.orgId, ctx.userId, {
      projectId: ctx.projectId,
      assigneeId: target.id,
      ...withSelectorContext(assignment, ctx),
    });

    results.push({
      assignee: target,
      assigned: result.assigned.map((t) => ({
        ticketKey: t.ticketKey,
        title: t.title,
      })),
      reassigned: result.reassigned.map((t) => ({
        ticketKey: t.ticketKey,
        title: t.title,
      })),
      skipped: result.skipped,
    });
  }

  return { type: "assign_tickets", results, skipped };
}

export function executeOpenConfig(args: {
  tab: "labels" | "statuses" | "types";
}): AiAction {
  return {
    type: "open_config",
    tab: args.tab,
  };
}

const WORKSPACE_PAGE_PATH: Record<
  "board" | "backlog" | "inbox" | "assistant" | "members" | "settings",
  string
> = {
  board: "/board",
  backlog: "/backlog",
  inbox: "/inbox",
  assistant: "/assistant",
  members: "/members",
  settings: "/settings",
};

export function executeNavigateWorkspace(args: {
  page: keyof typeof WORKSPACE_PAGE_PATH;
}): Extract<AiAction, { type: "navigate_page" }> {
  const page = args.page;
  if (!(page in WORKSPACE_PAGE_PATH)) {
    throw new AiChatError(`Unknown page "${String(page)}"`);
  }

  return { type: "navigate_page", page };
}

export { WORKSPACE_PAGE_PATH };
