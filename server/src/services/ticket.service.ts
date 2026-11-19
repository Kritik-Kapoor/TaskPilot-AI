import { prisma } from "../config/db.js";
import type {
  BoardFilterQuery,
  CreateTicketInput,
  UpdateTicketInput,
} from "../schemas/ticket.schema.js";
import {
  assertProjectAccess,
  createOrGetProjectLabel,
  getProjectMembership,
} from "./project.service.js";
import { normalizeStoredTicketDescription } from "../utils/ticketDescription.utils.js";
import {
  getAppendLexoRank,
  getLexoRankBetween,
  generateReindexPositions,
} from "../utils/ticketPosition.utils.js";
import { BACKLOG_COLUMN_NAME } from "../constants/boardColumns.js";
import { ensureDefaultWorkflowColumns } from "./boardColumn.service.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  resolveTicketsForBulkSelector,
  type TicketBulkSelector,
} from "../utils/ticketBulkSelector.utils.js";

import { ApiError } from "../utils/apiResponse.js";

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
      throw new ApiError(404, "Column not found in this project");
    }

    return column;
  }

  return resolveProjectColumnByName(projectId, input.columnName!);
};

export const resolveProjectColumnByName = async (
  projectId: string,
  columnName: string,
) => {
  const trimmed = columnName.trim();

  if (!trimmed) {
    throw new ApiError(400, "Column name is required");
  }

  const column = await prisma.boardColumn.findFirst({
    where: {
      projectId,
      name: { equals: trimmed, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });

  if (!column) {
    throw new ApiError(
      404,
      `Column "${trimmed}" doesn't exist in this project. Check the board column names and try again.`,
    );
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
    throw new ApiError(400, "Assignee must be a member of this project");
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
): Promise<string | null> => {
  const result = await tx.ticket.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return result?.position ?? null;
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

  const positions = generateReindexPositions(tickets.length);

  await Promise.all(
    tickets.map((ticket, index) =>
      tx.ticket.update({
        where: { id: ticket.id },
        data: { position: positions[index] },
      }),
    ),
  );
};

const resolveInsertPosition = async (
  columnId: string,
  explicitPosition: string | undefined,
  tx: TransactionClient,
) => {
  if (explicitPosition !== undefined) {
    return explicitPosition;
  }

  const maxPosition = await getColumnMaxPosition(columnId, tx);
  return getAppendLexoRank(maxPosition);
};

export const normalizeColumnPositionsIfNeeded = async (
  columnId: string,
  position: string,
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

  const newPosition = getLexoRankBetween(
    prev?.position ?? null,
    next?.position ?? null,
  );

  if (newPosition !== null) return newPosition;

  await reindexColumnTickets(columnId, tx);

  const refreshedMax = await getColumnMaxPosition(columnId, tx);
  return getAppendLexoRank(refreshedMax);
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
    throw new ApiError(
      403,
      "You do not have permission to create tickets in this project",
    );
  }

  const column = await resolveColumn(input.projectId, input);
  await assertAssigneeInProject(input.assigneeId, input.projectId);

  return prisma.$transaction(async (tx) => {
    const position = await resolveInsertPosition(column.id, input.position, tx);

    const ticketKey = await generateTicketKey(project.id, project.projectKey);

    const description = normalizeStoredTicketDescription(input.description);

    return tx.ticket.create({
      data: {
        projectId: input.projectId,
        columnId: column.id,
        ticketKey,
        title: input.title,
        ...(description !== undefined && {
          description:
            description === null
              ? Prisma.DbNull
              : (description as Prisma.InputJsonValue),
        }),
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

  await ensureDefaultWorkflowColumns(projectId);

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

  const isMinimalBoard = columns.length === 1;

  return { columns, totalTicketCount, filteredTicketCount, isMinimalBoard };
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
    select: {
      ...columnSelect,
      _count: { select: { tickets: true } },
    },
  });

  return {
    columns: columns.map(({ _count, ...column }) => ({
      ...column,
      ticketCount: _count.tickets,
    })),
  };
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
    throw new ApiError(404, "Ticket not found");
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
    throw new ApiError(
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
    throw new ApiError(404, "Ticket not found");
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
      throw new ApiError(404, "Column not found in this project");
    }
  }

  return prisma.$transaction(async (tx) => {
    const isMovingColumn = targetColumnId !== existing.columnId;
    const isUpdatingPosition = input.position !== undefined;

    let position = existing.position;

    if (isMovingColumn && input.position === undefined) {
      const maxPosition = await getColumnMaxPosition(targetColumnId, tx);
      position = getAppendLexoRank(maxPosition);
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
          description: (() => {
            const normalized = normalizeStoredTicketDescription(
              input.description,
            );
            return normalized === null
              ? Prisma.DbNull
              : (normalized as Prisma.InputJsonValue);
          })(),
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

const buildReassignmentComment = (
  targetName: string,
): Prisma.InputJsonValue => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `Re-assigned this ticket to ${targetName}.`,
        },
      ],
    },
  ],
});

const buildMoveColumnComment = (columnName: string): Prisma.InputJsonValue => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `Moved ticket to ${columnName} column.`,
        },
      ],
    },
  ],
});

export type AssignTicketsInput = TicketBulkSelector & {
  projectId: string;
  assigneeId: string;
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
    throw new ApiError(
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
    throw new ApiError(400, "Assignee must be a member of this project");
  }

  if (targetMembership.role === "VIEWER") {
    throw new ApiError(
      400,
      "Tickets cannot be assigned to a project member with view only access",
    );
  }

  const { tickets, notFoundKeys } = await resolveTicketsForBulkSelector(
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

  const target = await prisma.user.findUnique({
    where: { id: input.assigneeId },
    select: { username: true },
  });

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
          content: buildReassignmentComment(targetName),
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

export type AddLabelsToTicketsResult = {
  labels: { id: string; name: string; created: boolean }[];
  labeled: { ticketKey: string; title: string }[];
  skipped: { ticketKey: string; reason: string }[];
};

export const addLabelsToTickets = async (
  orgId: string,
  userId: string,
  input: {
    projectId: string;
    labelNames: string[];
    labelColor?: string;
  } & TicketBulkSelector,
): Promise<AddLabelsToTicketsResult> => {
  const { membership } = await assertProjectAccess(
    userId,
    orgId,
    input.projectId,
  );

  if (membership.role === "VIEWER") {
    throw new ApiError(
      403,
      "You do not have permission to update tickets in this project",
    );
  }

  const labelNames = [
    ...new Set(
      (input.labelNames ?? [])
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (labelNames.length === 0) {
    throw new ApiError(400, "Please specify which labels to add.");
  }

  const labels: AddLabelsToTicketsResult["labels"] = [];

  for (const name of labelNames) {
    const label = await createOrGetProjectLabel(
      orgId,
      userId,
      input.projectId,
      {
        name,
        color: input.labelColor,
      },
    );

    labels.push({
      id: label.id,
      name: label.name,
      created: !label.alreadyExisted,
    });
  }

  const { tickets, notFoundKeys } = await resolveTicketsForBulkSelector(
    input.projectId,
    input,
  );

  const result: AddLabelsToTicketsResult = {
    labels,
    labeled: [],
    skipped: [],
  };

  for (const key of notFoundKeys) {
    result.skipped.push({
      ticketKey: key,
      reason: "Ticket not found in this project",
    });
  }

  const labelIds = labels.map((label) => label.id);

  const ticketsWithLabels =
    tickets.length === 0
      ? []
      : await prisma.ticket.findMany({
          where: { id: { in: tickets.map((ticket) => ticket.id) } },
          select: {
            id: true,
            ticketKey: true,
            title: true,
            labels: { select: { id: true } },
          },
        });

  for (const ticket of ticketsWithLabels) {
    const existingIds = new Set(ticket.labels.map((label) => label.id));
    const toAdd = labelIds.filter((id) => !existingIds.has(id));

    if (toAdd.length === 0) {
      result.skipped.push({
        ticketKey: ticket.ticketKey,
        reason: "This ticket already has that label",
      });
      continue;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        labels: {
          connect: toAdd.map((id) => ({ id })),
        },
      },
    });

    result.labeled.push({
      ticketKey: ticket.ticketKey,
      title: ticket.title,
    });
  }

  return result;
};

export type RemoveLabelsFromTicketsResult = {
  labels: string[];
  updated: { ticketKey: string; title: string }[];
  skipped: { ticketKey: string; reason: string }[];
};

export const removeLabelsFromTickets = async (
  orgId: string,
  userId: string,
  input: {
    projectId: string;
    labelNames: string[];
  } & TicketBulkSelector,
): Promise<RemoveLabelsFromTicketsResult> => {
  const { membership } = await assertProjectAccess(
    userId,
    orgId,
    input.projectId,
  );

  if (membership.role === "VIEWER") {
    throw new ApiError(
      403,
      "You do not have permission to update tickets in this project",
    );
  }

  const labelNames = [
    ...new Set(
      (input.labelNames ?? [])
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  if (labelNames.length === 0) {
    throw new ApiError(400, "Please specify which labels to remove.");
  }

  const labelRecords = await prisma.label.findMany({
    where: {
      projectId: input.projectId,
      name: { in: labelNames, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });

  const labelsByName = new Map(
    labelRecords.map((label) => [label.name.toLowerCase(), label]),
  );

  const missingLabels = labelNames.filter((name) => !labelsByName.has(name));

  if (missingLabels.length > 0) {
    throw new ApiError(
      404,
      `Label(s) not found in this project: ${missingLabels.join(", ")}`,
    );
  }

  const labelIds = labelRecords.map((label) => label.id);

  const { tickets, notFoundKeys } = await resolveTicketsForBulkSelector(
    input.projectId,
    input,
  );

  const result: RemoveLabelsFromTicketsResult = {
    labels: labelNames,
    updated: [],
    skipped: [],
  };

  for (const key of notFoundKeys) {
    result.skipped.push({
      ticketKey: key,
      reason: "Ticket not found in this project",
    });
  }

  if (tickets.length === 0) return result;

  const ticketsWithLabels = await prisma.ticket.findMany({
    where: { id: { in: tickets.map((ticket) => ticket.id) } },
    select: {
      id: true,
      ticketKey: true,
      title: true,
      labels: { select: { id: true } },
    },
  });

  for (const ticket of ticketsWithLabels) {
    const toRemove = labelIds.filter((id) =>
      ticket.labels.some((label) => label.id === id),
    );

    if (toRemove.length === 0) {
      result.skipped.push({
        ticketKey: ticket.ticketKey,
        reason: "This ticket doesn't have that label",
      });
      continue;
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        labels: {
          disconnect: toRemove.map((id) => ({ id })),
        },
      },
    });

    result.updated.push({
      ticketKey: ticket.ticketKey,
      title: ticket.title,
    });
  }

  return result;
};

export type MoveTicketsResult = {
  columnName: string;
  moved: { ticketKey: string; title: string }[];
  skipped: { ticketKey: string; reason: string }[];
};

export const moveTicketsToColumn = async (
  orgId: string,
  userId: string,
  input: {
    projectId: string;
    columnName: string;
  } & TicketBulkSelector,
): Promise<MoveTicketsResult> => {
  const { membership } = await assertProjectAccess(
    userId,
    orgId,
    input.projectId,
  );

  if (membership.role === "VIEWER") {
    throw new ApiError(
      403,
      "You do not have permission to move tickets in this project",
    );
  }

  const targetColumn = await resolveProjectColumnByName(
    input.projectId,
    input.columnName,
  );

  const { tickets, notFoundKeys } = await resolveTicketsForBulkSelector(
    input.projectId,
    input,
  );

  const result: MoveTicketsResult = {
    columnName: targetColumn.name,
    moved: [],
    skipped: [],
  };

  for (const key of notFoundKeys) {
    result.skipped.push({
      ticketKey: key,
      reason: "Ticket not found in this project",
    });
  }

  if (tickets.length === 0) return result;

  for (const ticket of tickets) {
    if (ticket.columnId === targetColumn.id) {
      result.skipped.push({
        ticketKey: ticket.ticketKey,
        reason: `This ticket is already in ${targetColumn.name}`,
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const maxPosition = await getColumnMaxPosition(targetColumn.id, tx);
      const position = getAppendLexoRank(maxPosition);

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          columnId: targetColumn.id,
          position,
        },
      });

      await tx.comment.create({
        data: {
          ticketId: ticket.id,
          userId,
          content: buildMoveColumnComment(targetColumn.name),
        },
      });
    });

    result.moved.push({
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
    throw new ApiError(
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
    throw new ApiError(404, "Ticket not found");
  }

  await prisma.ticket.delete({ where: { id: ticketId } });

  return { id: ticketId };
};
