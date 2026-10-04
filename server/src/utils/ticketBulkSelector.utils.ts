import { prisma } from "../config/db.js";
import { ApiError } from "./apiResponse.js";
import {
  AssignmentDateParseError,
  AssignmentTimeZoneError,
  buildAssignmentCreatedAtFilter,
  DEFAULT_ASSIGNMENT_TIME_ZONE,
} from "./assignmentDate.utils.js";
import type { Prisma } from "../generated/prisma/client.js";

export type TicketBulkSelector = {
  ticketKeys?: string[];
  allTickets?: boolean;
  date?: string;
  dateRange?: { from: string; to: string };
  withLabels?: string[];
  onlyUnassigned?: boolean;
  timeZone?: string;
};

const bulkTicketSelect = {
  id: true,
  ticketKey: true,
  title: true,
  assigneeId: true,
  columnId: true,
} satisfies Prisma.TicketSelect;

export type ResolvedBulkTickets = {
  tickets: {
    id: string;
    ticketKey: string;
    title: string;
    assigneeId: string | null;
    columnId: string;
  }[];
  notFoundKeys: string[];
};

const parseDateFilter = (
  timeZone: string,
  date?: string,
  dateRange?: { from: string; to: string },
): Prisma.TicketWhereInput | null => {
  try {
    return buildAssignmentCreatedAtFilter(timeZone, date, dateRange);
  } catch (error) {
    if (
      error instanceof AssignmentDateParseError ||
      error instanceof AssignmentTimeZoneError ||
      error instanceof Error
    ) {
      throw new ApiError(400, error.message);
    }
    throw error;
  }
};

export const assertValidTicketBulkSelector = (selector: TicketBulkSelector) => {
  const scopeCount = [
    (selector.ticketKeys?.length ?? 0) > 0,
    Boolean(selector.allTickets),
    Boolean(selector.date),
    Boolean(selector.dateRange),
  ].filter(Boolean).length;

  if (scopeCount === 0) {
    throw new ApiError(
      400,
      "Please specify which tickets to affect. Provide ticket keys, set allTickets to true, or give a date or date range.",
    );
  }

  if (scopeCount > 1) {
    throw new ApiError(
      400,
      "Please specify only one scope: ticket keys, allTickets, a date, or a date range.",
    );
  }

  if (selector.date || selector.dateRange) {
    parseDateFilter(
      selector.timeZone ?? DEFAULT_ASSIGNMENT_TIME_ZONE,
      selector.date,
      selector.dateRange,
    );
  }
};

export const describeTicketBulkSelector = (
  selector: TicketBulkSelector,
): string[] => {
  if (selector.ticketKeys?.length) return selector.ticketKeys;

  if (selector.allTickets) {
    const parts = ["All tickets"];
    if (selector.withLabels?.length) {
      parts.push(`with label(s) ${selector.withLabels.join(", ")}`);
    }
    if (selector.onlyUnassigned) parts.push("(unassigned only)");
    return [parts.join(" ")];
  }

  if (selector.date) return [`Tickets created on ${selector.date}`];
  if (selector.dateRange) {
    return [
      `Tickets created ${selector.dateRange.from} to ${selector.dateRange.to}`,
    ];
  }

  return ["Unspecified tickets"];
};

export const resolveTicketsForBulkSelector = async (
  projectId: string,
  selector: TicketBulkSelector,
): Promise<ResolvedBulkTickets> => {
  assertValidTicketBulkSelector(selector);

  const timeZone = selector.timeZone ?? DEFAULT_ASSIGNMENT_TIME_ZONE;

  if (selector.ticketKeys?.length) {
    const requestedKeys = selector.ticketKeys.map((key) => key.trim());

    const tickets = await prisma.ticket.findMany({
      where: {
        projectId,
        ticketKey: { in: requestedKeys, mode: "insensitive" },
      },
      select: bulkTicketSelect,
    });

    const foundKeys = new Set(
      tickets.map((ticket) => ticket.ticketKey.toLowerCase()),
    );

    const notFoundKeys = requestedKeys.filter(
      (key) => !foundKeys.has(key.toLowerCase()),
    );

    return { tickets, notFoundKeys };
  }

  const where: Prisma.TicketWhereInput = { projectId };

  if (selector.date || selector.dateRange) {
    Object.assign(
      where,
      parseDateFilter(timeZone, selector.date, selector.dateRange),
    );
  }

  if (selector.onlyUnassigned) {
    where.assigneeId = null;
  }

  if (selector.withLabels?.length) {
    const labelNames = [
      ...new Set(
        selector.withLabels
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (labelNames.length === 0) {
      throw new ApiError(400, "Please specify valid label names.");
    }

    where.AND = labelNames.map((name) => ({
      labels: {
        some: {
          name: { equals: name, mode: "insensitive" },
        },
      },
    }));
  }

  const tickets = await prisma.ticket.findMany({
    where,
    select: bulkTicketSelect,
  });

  return { tickets, notFoundKeys: [] };
};
