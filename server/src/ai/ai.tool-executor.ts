import { prisma } from "../config/db.js";
import { AiChatError } from "./ai.errors.js";
import type { AiAction, AssignTicketsActionResult } from "./ai.types.js";
import { MAX_ASSIGNMENTS_PER_REQUEST } from "./ai.tools.js";
import {
  TicketServiceError,
  assertValidAssignmentSelector,
  assignOrReassignTickets,
  createTicket as createTicketService,
} from "../services/ticket.service.js";
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

/**
 * Resolves every raw assignee ("current_user" or an email) used in an
 * assign_tickets call to a project member, in one query. Entries that can't be
 * resolved (not an email, not in the project, view-only) don't fail the call;
 * they're returned in `rejections` with a reason so only their tickets are
 * skipped.
 */
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
  },
  ctx: ToolContext,
): Promise<AiAction> {
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

  return {
    type: "create_ticket",
    ticket: {
      id: ticket.id,
      ticketKey: ticket.ticketKey,
      title: ticket.title,
      columnId: ticket.columnId,
    },
  };
}

type AssignmentArg = {
  assignee: string;
  ticketKeys?: string[];
  date?: string;
  dateRange?: { from: string; to: string };
};

/** What to show in the skipped list for an entry we couldn't process. */
const describeAssignmentTickets = (assignment: AssignmentArg): string[] => {
  if (assignment.ticketKeys?.length) return assignment.ticketKeys;
  if (assignment.date) return [`Tickets created on ${assignment.date}`];
  if (assignment.dateRange) {
    return [
      `Tickets created ${assignment.dateRange.from} to ${assignment.dateRange.to}`,
    ];
  }
  return ["Unspecified tickets"];
};

/**
 * Assigns/re-assigns tickets for one or more assignees in a single request,
 * e.g. "assign TK-1 to a@x.com and TK-2 to b@x.com".
 *
 * Each assignee entry is handled independently: an entry that can't be
 * processed (unknown email, view-only member, bad selector or date) has its
 * tickets reported as skipped while the other entries still go through. The
 * only whole-request failures are structural ones: no entries, too many
 * entries, or the same ticket given to two different people.
 */
export async function executeAssignTickets(
  args: { assignments: AssignmentArg[] },
  ctx: ToolContext,
): Promise<AiAction> {
  const assignments = args.assignments ?? [];

  if (assignments.length === 0) {
    throw new AiChatError(
      "Tell me which tickets to assign and to whom, e.g. \"assign TB-1 to jane@company.com\".",
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
        assertValidAssignmentSelector({
          ...assignment,
          timeZone: ctx.timeZone,
        });
      } catch (error) {
        if (!(error instanceof TicketServiceError)) throw error;
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

  const assigneeByTicketKey = new Map<string, string>();

  for (const { assignment, target } of runnable) {
    for (const key of assignment.ticketKeys ?? []) {
      const normalizedKey = key.trim().toLowerCase();
      const existingTarget = assigneeByTicketKey.get(normalizedKey);

      if (existingTarget && existingTarget !== target.id) {
        throw new AiChatError(
          `${key.trim()} is listed for more than one person. A ticket can only be assigned to one person at a time.`,
        );
      }

      assigneeByTicketKey.set(normalizedKey, target.id);
    }
  }

  const results: AssignTicketsActionResult[] = [];

  for (const { assignment, target } of runnable) {
    const result = await assignOrReassignTickets(ctx.orgId, ctx.userId, {
      projectId: ctx.projectId,
      assigneeId: target.id,
      ticketKeys: assignment.ticketKeys,
      date: assignment.date,
      dateRange: assignment.dateRange,
      timeZone: ctx.timeZone,
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
