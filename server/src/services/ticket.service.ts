import { prisma } from "../config/db.js";
import type {
  BoardFilterQuery,
  CreateTicketInput,
  UpdateTicketInput,
} from "../schemas/ticket.schema.js";
import { findProjectInOrg, getProjectMembership } from "./project.service.js";
import {
  getAppendPosition,
  getPositionBetween,
  TICKET_POSITION_GAP,
} from "../utils/ticketPosition.utils.js";
import { BACKLOG_COLUMN_NAME } from "../constants/boardColumns.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  AssignmentDateParseError,
  AssignmentTimeZoneError,
  buildAssignmentCreatedAtFilter,
  DEFAULT_ASSIGNMENT_TIME_ZONE,
} from "../utils/assignmentDate.utils.js";

export class TicketServiceError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const ticketBaseSelect = {
  id: true,
  ticketKey: true,
  title: true,
  description: true,
  priority: true,
  typeId: true,
  issueType: {
    select: {
      id: true,
      key: true,
      color: true,
    },
  },
  position: true,
  storyPoints: true,
  columnId: true,
  projectId: true,
  assigneeId: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  assignee: {
    select: {
      id: true,
      username: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
    },
  },
  labels: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
} satisfies Prisma.TicketSelect;

// Full select includes the column relation — used for single-ticket responses
// where the caller doesn't have column context from a parent query.
const ticketSelect = {
  ...ticketBaseSelect,
  column: {
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
    },
  },
} satisfies Prisma.TicketSelect;

type TransactionClient = Prisma.TransactionClient;

const assertProjectAccess = async (
  userId: string,
  orgId: string,
  projectId: string,
) => {
  const project = await findProjectInOrg(projectId, orgId);

  if (!project) throw new TicketServiceError(404, "Project not found");

  const membership = await getProjectMembership(userId, projectId);

  if (!membership) {
    throw new TicketServiceError(403, "You are not a member of this project");
  }

  return { project, membership };
};

const resolveColumn = async (
  projectId: string,
  input: Pick<CreateTicketInput, "columnId" | "columnName">,
) => {
  if (input.columnId) {
    const column = await prisma.boardColumn.findFirst({
      where: { id: input.columnId, projectId },
      select: { id: true },
    });

    if (!column) {
      throw new TicketServiceError(404, "Column not found in this project");
    }

    return column;
  }

  const column = await prisma.boardColumn.findFirst({
    where: { projectId, name: input.columnName! },
    select: { id: true },
  });

  if (!column) {
    throw new TicketServiceError(404, "Column not found in this project");
  }

  return column;
};

const assertAssigneeInProject = async (
  assigneeId: string | null | undefined,
  projectId: string,
) => {
  if (!assigneeId) return;

  const assigneeMembership = await getProjectMembership(assigneeId, projectId);

  if (!assigneeMembership) {
    throw new TicketServiceError(
      400,
      "Assignee must be a member of this project",
    );
  }
};

const generateTicketKey = async (projectId: string, projectKey: string) => {
  const tickets = await prisma.ticket.findMany({
    where: { projectId },
    select: { ticketKey: true },
  });

  const prefix = `${projectKey}-`;
  let maxNumber = 100;

  for (const ticket of tickets) {
    if (!ticket.ticketKey.startsWith(prefix)) continue;

    const suffix = Number.parseInt(ticket.ticketKey.slice(prefix.length), 10);
    if (!Number.isNaN(suffix) && suffix > maxNumber) {
      maxNumber = suffix;
    }
  }

  return `${projectKey}-${maxNumber + 1}`;
};

const getColumnMaxPosition = async (
  columnId: string,
  tx: TransactionClient = prisma,
) => {
  const result = await tx.ticket.aggregate({
    where: { columnId },
    _max: { position: true },
  });

  return result._max.position;
};

const reindexColumnTickets = async (
  columnId: string,
  tx: TransactionClient,
) => {
  const tickets = await tx.ticket.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
    select: { id: true },
  });

  await Promise.all(
    tickets.map((ticket, index) =>
      tx.ticket.update({
        where: { id: ticket.id },
        data: { position: (index + 1) * TICKET_POSITION_GAP },
      }),
    ),
  );
};

const resolveInsertPosition = async (
  columnId: string,
  explicitPosition: number | undefined,
  tx: TransactionClient,
) => {
  if (explicitPosition !== undefined) {
    return explicitPosition;
  }

  const maxPosition = await getColumnMaxPosition(columnId, tx);
  return getAppendPosition(maxPosition);
};

export const normalizeColumnPositionsIfNeeded = async (
  columnId: string,
  position: number,
  tx: TransactionClient = prisma,
) => {
  const neighbours = await tx.ticket.findMany({
    where: { columnId },
    orderBy: { position: "asc" },
    select: { position: true },
  });

  const next = neighbours.find((ticket) => ticket.position > position);
  const prev = [...neighbours]
    .reverse()
    .find((ticket) => ticket.position < position);

  const newPosition = getPositionBetween(
    prev?.position ?? null,
    next?.position ?? null,
  );

  if (newPosition !== null) return newPosition;

  await reindexColumnTickets(columnId, tx);

  const refreshedMax = await getColumnMaxPosition(columnId, tx);
  return getAppendPosition(refreshedMax);
};

export const createTicket = async (
  orgId: string,
  userId: string,
  input: CreateTicketInput,
) => {
  const { project, membership } = await assertProjectAccess(
    userId,
    orgId,
    input.projectId,
  );

  if (membership.role === "VIEWER") {
    throw new TicketServiceError(
      403,
      "You do not have permission to create tickets in this project",
    );
  }

  const column = await resolveColumn(input.projectId, input);
  await assertAssigneeInProject(input.assigneeId, input.projectId);

  return prisma.$transaction(async (tx) => {
    const position = await resolveInsertPosition(column.id, input.position, tx);

    const ticketKey = await generateTicketKey(project.id, project.projectKey);

    return tx.ticket.create({
      data: {
        projectId: input.projectId,
        columnId: column.id,
        ticketKey,
        title: input.title,
        description: input.description as Prisma.InputJsonValue | undefined,
        priority: input.priority ?? "MEDIUM",
        typeId: input.typeId ?? null,
        assigneeId: input.assigneeId ?? null,
        storyPoints: input.storyPoints ?? null,
        position,
        createdById: userId,
        ...(input.labels && {
          labels: {
            connect: input.labels.map((label) => ({ id: label })),
          },
        }),
      },
      select: ticketBaseSelect,
    });
  });
};

const nonBacklogColumnFilter = { name: { not: BACKLOG_COLUMN_NAME } } as const;

const hasActiveBoardFilters = (filters?: BoardFilterQuery) => {
  if (!filters) return false;

  return Boolean(
    filters.query ||
    filters.assignee.length > 0 ||
    filters.priority !== "all" ||
    filters.type !== "all" ||
    filters.labels.length > 0,
  );
};

const buildBoardTicketWhere = (
  filters?: BoardFilterQuery,
): Prisma.TicketWhereInput | undefined => {
  if (!hasActiveBoardFilters(filters) || !filters) return undefined;

  const where: Prisma.TicketWhereInput = {};

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { ticketKey: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.assignee.length > 0) {
    const hasUnassigned = filters.assignee.includes("unassigned");
    const assigneeIds = filters.assignee.filter((id) => id !== "unassigned");

    if (hasUnassigned && assigneeIds.length > 0) {
      where.AND = [
        { OR: [{ assigneeId: null }, { assigneeId: { in: assigneeIds } }] },
      ];
    } else if (hasUnassigned) {
      where.assigneeId = null;
    } else {
      where.assigneeId = { in: assigneeIds };
    }
  }

  if (filters.priority !== "all") where.priority = filters.priority;

  if (filters.type !== "all") where.typeId = filters.type;

  if (filters.labels.length > 0) {
    where.labels = {
      some: {
        id: { in: filters.labels },
      },
    };
  }

  return where;
};

const buildBoardTicketCountWhere = (
  projectId: string,
  filters?: BoardFilterQuery,
): Prisma.TicketWhereInput => {
  const ticketFilter = buildBoardTicketWhere(filters);

  return {
    AND: [
      { projectId },
      { column: nonBacklogColumnFilter },
      ...(ticketFilter ? [ticketFilter] : []),
    ],
  };
};

export const getProjectTickets = async (
  orgId: string,
  userId: string,
  projectId: string,
  filters?: BoardFilterQuery,
) => {
  await assertProjectAccess(userId, orgId, projectId);

  const ticketFilter = buildBoardTicketWhere(filters);

  const [columns, totalTicketCount, filteredTicketCount] = await Promise.all([
    prisma.boardColumn.findMany({
      where: { projectId, ...nonBacklogColumnFilter },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        color: true,
        position: true,
        tickets: {
          ...(ticketFilter ? { where: ticketFilter } : {}),
          orderBy: { position: "asc" },
          select: ticketBaseSelect,
        },
      },
    }),
    prisma.ticket.count({
      where: {
        projectId,
        column: nonBacklogColumnFilter,
      },
    }),
    prisma.ticket.count({
      where: buildBoardTicketCountWhere(projectId, filters),
    }),
  ]);

  return { columns, totalTicketCount, filteredTicketCount };
};

const columnSelect = {
  id: true,
  name: true,
  color: true,
  position: true,
} as const;

export const getProjectColumns = async (
  orgId: string,
  userId: string,
  projectId: string,
) => {
  await assertProjectAccess(userId, orgId, projectId);

  const columns = await prisma.boardColumn.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
    select: columnSelect,
  });

  return { columns };
};

const findBacklogColumn = (projectId: string) =>
  prisma.boardColumn.findFirst({
    where: { projectId, name: BACKLOG_COLUMN_NAME },
    select: columnSelect,
  });

export const getProjectBacklogTickets = async (
  orgId: string,
  userId: string,
  projectId: string,
) => {
  await assertProjectAccess(userId, orgId, projectId);

  const backlogColumn = await findBacklogColumn(projectId);

  if (!backlogColumn) {
    return { column: null, tickets: [], totalTicketCount: 0 };
  }

  const tickets = await prisma.ticket.findMany({
    where: { projectId, columnId: backlogColumn.id },
    orderBy: { position: "asc" },
    select: ticketBaseSelect,
  });

  return {
    column: backlogColumn,
    tickets,
    totalTicketCount: tickets.length,
  };
};

export const getTicketById = async (
  orgId: string,
  projectId: string,
  userId: string,
  ticketId: string,
) => {
  await assertProjectAccess(userId, orgId, projectId);

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      ...ticketSelect,
      project: {
        select: { organizationId: true },
      },
    },
  });

  if (!ticket || ticket.project.organizationId !== orgId) {
    throw new TicketServiceError(404, "Ticket not found");
  }

  const { project: _project, ...ticketData } = ticket;
  return ticketData;
};

export const updateTicket = async (
  orgId: string,
  projectId: string,
  userId: string,
  ticketId: string,
  input: UpdateTicketInput,
) => {
  const { membership } = await assertProjectAccess(userId, orgId, projectId);

  if (membership.role === "VIEWER") {
    throw new TicketServiceError(
      403,
      "You do not have permission to update tickets in this project",
    );
  }

  const existing = await prisma.ticket.findFirst({
    where: { id: ticketId, projectId },
    select: {
      id: true,
      columnId: true,
      position: true,
      project: {
        select: { organizationId: true },
      },
    },
  });

  if (!existing || existing.project.organizationId !== orgId) {
    throw new TicketServiceError(404, "Ticket not found");
  }

  if (input.assigneeId) {
    await assertAssigneeInProject(input.assigneeId, projectId);
  }

  const targetColumnId = input.columnId ?? existing.columnId;

  if (input.columnId) {
    const column = await prisma.boardColumn.findFirst({
      where: { id: input.columnId, projectId },
      select: { id: true },
    });

    if (!column) {
      throw new TicketServiceError(404, "Column not found in this project");
    }
  }

  return prisma.$transaction(async (tx) => {
    const isMovingColumn = targetColumnId !== existing.columnId;
    const isUpdatingPosition = input.position !== undefined;

    let position = existing.position;

    if (isMovingColumn && input.position === undefined) {
      const maxPosition = await getColumnMaxPosition(targetColumnId, tx);
      position = getAppendPosition(maxPosition);
    } else if (input.position !== undefined) {
      position = input.position;

      const normalized = await normalizeColumnPositionsIfNeeded(
        targetColumnId,
        input.position,
        tx,
      );

      if (normalized !== input.position) {
        position = normalized;
      }
    }

    return tx.ticket.update({
      where: { id: ticketId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && {
          description:
            input.description === null
              ? Prisma.DbNull
              : (input.description as Prisma.InputJsonValue),
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.typeId !== undefined && { typeId: input.typeId }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
        ...(input.storyPoints !== undefined && {
          storyPoints: input.storyPoints,
        }),
        ...(input.labels !== undefined && {
          labels: {
            set: input.labels.map((labelId) => ({ id: labelId })),
          },
        }),
        ...(isMovingColumn && { columnId: targetColumnId }),
        ...(isMovingColumn || isUpdatingPosition ? { position } : {}),
      },
      select: ticketBaseSelect,
    });
  });
};

const parseAssignmentDateFilter = (
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
      throw new TicketServiceError(400, error.message);
    }
    throw error;
  }
};

const assignmentTicketSelect = {
  id: true,
  ticketKey: true,
  title: true,
  assigneeId: true,
} satisfies Prisma.TicketSelect;

const resolveTicketsForAssignment = async (
  projectId: string,
  selector: {
    ticketKeys?: string[];
    date?: string;
    dateRange?: { from: string; to: string };
    timeZone?: string;
  },
) => {
  const selectorsProvided = [
    (selector.ticketKeys?.length ?? 0) > 0,
    Boolean(selector.date),
    Boolean(selector.dateRange),
  ].filter(Boolean).length;

  if (selectorsProvided === 0) {
    throw new TicketServiceError(
      400,
      "Please specify which tickets to assign. Provide ticket keys, a date, or a date range.",
    );
  }

  if (selectorsProvided > 1) {
    throw new TicketServiceError(
      400,
      "Please specify only one of: ticket keys, a date, or a date range. Don't provide multiple selectors.",
    );
  }

  if (selector.ticketKeys?.length) {
    const requestedKeys = selector.ticketKeys.map((key) => key.trim());

    const tickets = await prisma.ticket.findMany({
      where: {
        projectId,
        ticketKey: { in: requestedKeys, mode: "insensitive" },
      },
      select: assignmentTicketSelect,
    });

    const foundKeys = new Set(
      tickets.map((ticket) => ticket.ticketKey.toLowerCase()),
    );

    const notFoundKeys = requestedKeys.filter(
      (key) => !foundKeys.has(key.toLowerCase()),
    );

    return { tickets, notFoundKeys };
  }

  const dateFilter = parseAssignmentDateFilter(
    selector.timeZone ?? DEFAULT_ASSIGNMENT_TIME_ZONE,
    selector.date,
    selector.dateRange,
  );

  const tickets = await prisma.ticket.findMany({
    where: { projectId, ...dateFilter },
    select: assignmentTicketSelect,
  });

  return { tickets, notFoundKeys: [] as string[] };
};

const buildReassignmentComment = (
  actorName: string,
  targetName: string,
): Prisma.InputJsonValue => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${actorName} re-assigned this ticket to ${targetName}.`,
        },
      ],
    },
  ],
});

export type AssignTicketsInput = {
  projectId: string;
  assigneeId: string;
  ticketKeys?: string[];
  date?: string;
  dateRange?: { from: string; to: string };
  /** IANA timezone from the client (e.g. Asia/Kolkata). Defaults to UTC. */
  timeZone?: string;
};

export type AssignTicketsResult = {
  assigned: { id: string; ticketKey: string; title: string }[];
  reassigned: { id: string; ticketKey: string; title: string }[];
  skipped: { ticketKey: string; reason: string }[];
};

// Permission rules:
// -VIEWERs can't assign/re-assign anything.
// - Only MEMBER/ADMIN project members can be assignment targets.
// - A MEMBER may only assign unassigned tickets to themselves.
// - A MEMBER may only re-assign tickets assigned to them.
// - An ADMIN may assign/re-assign any ticket to anyone in the project except VIEWERs.
// - Re-assigning a ticket to its current assignee is reported as skipped.

export const assignOrReassignTickets = async (
  orgId: string,
  userId: string,
  input: AssignTicketsInput,
): Promise<AssignTicketsResult> => {
  const { membership } = await assertProjectAccess(
    userId,
    orgId,
    input.projectId,
  );

  if (membership.role === "VIEWER") {
    throw new TicketServiceError(
      403,
      "You do not have permission to assign tickets in this project",
    );
  }

  const isAdmin = membership.role === "ADMIN";

  const targetMembership = await getProjectMembership(
    input.assigneeId,
    input.projectId,
  );

  if (!targetMembership) {
    throw new TicketServiceError(
      400,
      "Assignee must be a member of this project",
    );
  }

  if (targetMembership.role === "VIEWER") {
    throw new TicketServiceError(
      400,
      "Tickets cannot be assigned to a project member with view only access",
    );
  }

  const { tickets, notFoundKeys } = await resolveTicketsForAssignment(
    input.projectId,
    input,
  );

  const result: AssignTicketsResult = {
    assigned: [],
    reassigned: [],
    skipped: [],
  };

  for (const key of notFoundKeys) {
    result.skipped.push({
      ticketKey: key,
      reason: "Ticket not found in this project",
    });
  }

  if (tickets.length === 0) return result;

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    }),
    prisma.user.findUnique({
      where: { id: input.assigneeId },
      select: { username: true },
    }),
  ]);

  const actorName = actor?.username ?? "Someone";
  const targetName = target?.username ?? "another user";

  for (const ticket of tickets) {
    if (ticket.assigneeId === input.assigneeId) {
      result.skipped.push({
        ticketKey: ticket.ticketKey,
        reason: "This ticket is already assigned to that user",
      });
      continue;
    }

    if (ticket.assigneeId === null) {
      if (!isAdmin && input.assigneeId !== userId) {
        result.skipped.push({
          ticketKey: ticket.ticketKey,
          reason: "You can only assign unassigned tickets to yourself",
        });
        continue;
      }

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { assigneeId: input.assigneeId },
      });

      result.assigned.push({
        id: ticket.id,
        ticketKey: ticket.ticketKey,
        title: ticket.title,
      });
      continue;
    }

    if (!isAdmin && ticket.assigneeId !== userId) {
      result.skipped.push({
        ticketKey: ticket.ticketKey,
        reason:
          "You can only re-assign tickets that are currently assigned to you",
      });
      continue;
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { assigneeId: input.assigneeId },
      }),
      prisma.comment.create({
        data: {
          ticketId: ticket.id,
          userId,
          content: buildReassignmentComment(actorName, targetName),
        },
      }),
    ]);

    result.reassigned.push({
      id: ticket.id,
      ticketKey: ticket.ticketKey,
      title: ticket.title,
    });
  }

  return result;
};

export const deleteTicket = async (
  orgId: string,
  projectId: string,
  userId: string,
  ticketId: string,
) => {
  const { membership } = await assertProjectAccess(userId, orgId, projectId);

  if (membership.role === "VIEWER") {
    throw new TicketServiceError(
      403,
      "You do not have permission to delete tickets in this project",
    );
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      project: {
        select: { organizationId: true },
      },
    },
  });

  if (!ticket || ticket.project.organizationId !== orgId) {
    throw new TicketServiceError(404, "Ticket not found");
  }

  await prisma.ticket.delete({ where: { id: ticketId } });

  return { id: ticketId };
};
