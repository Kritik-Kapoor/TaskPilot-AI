import { prisma } from "../config/db.js";
import { AiChatError } from "./ai.errors.js";
import type { AiAction } from "./ai.types.js";
import {
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

async function targetUserValidation(
  raw: string,
  ctx: ToolContext,
): Promise<string> {
  const value = raw.trim();

  if (value === "current_user") return ctx.userId;

  if (!EMAIL_PATTERN.test(value)) {
    throw new AiChatError(
      `To assign tickets to another user, please provide their email address rather than a name or anything else. Could not recognize: "${raw}".`,
    );
  }

  const member = await prisma.projectMember.findFirst({
    where: {
      projectId: ctx.projectId,
      user: { email: { equals: value, mode: "insensitive" } },
    },
    select: { userId: true },
  });

  if (!member) {
    throw new AiChatError(
      `"${value}" doesn't belong to this project. Please re-check the entered email.`,
    );
  }

  return member.userId;
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

export async function executeAssignTickets(
  args: {
    assignee: string;
    ticketKeys?: string[];
    date?: string;
    dateRange?: { from: string; to: string };
  },
  ctx: ToolContext,
): Promise<AiAction> {
  const targetUserId = await targetUserValidation(args.assignee, ctx);

  const result = await assignOrReassignTickets(ctx.orgId, ctx.userId, {
    projectId: ctx.projectId,
    assigneeId: targetUserId,
    ticketKeys: args.ticketKeys,
    date: args.date,
    dateRange: args.dateRange,
    timeZone: ctx.timeZone,
  });

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, username: true },
  });

  return {
    type: "assign_tickets",
    assignee: targetUser ?? { id: targetUserId, username: "this user" },
    assigned: result.assigned.map((t) => ({
      ticketKey: t.ticketKey,
      title: t.title,
    })),
    reassigned: result.reassigned.map((t) => ({
      ticketKey: t.ticketKey,
      title: t.title,
    })),
    skipped: result.skipped,
  };
}

export function executeOpenConfig(args: {
  tab: "labels" | "statuses" | "types";
}): AiAction {
  return {
    type: "open_config",
    tab: args.tab,
  };
}
