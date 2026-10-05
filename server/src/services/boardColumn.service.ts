import {
  BACKLOG_COLUMN_NAME,
  DEFAULT_BOARD_COLUMNS,
} from "../constants/boardColumns.js";
import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/db.js";
import { findProjectInOrg, getProjectMembership } from "./project.service.js";
import { ApiError } from "../utils/apiResponse.js";

type TransactionClient = Prisma.TransactionClient;

const DEFAULT_COLUMN_COLOR = "#6366f1";

export const isBacklogColumnName = (name: string) =>
  name.trim().toLowerCase() === BACKLOG_COLUMN_NAME.toLowerCase();

export const seedDefaultBoardColumns = (
  tx: TransactionClient,
  projectId: string,
) =>
  tx.boardColumn.createMany({
    data: DEFAULT_BOARD_COLUMNS.map((column) => ({
      projectId,
      name: column.name,
      color: column.color,
      position: column.position,
    })),
  });

export const createProjectBoardColumn = async (
  orgId: string,
  userId: string,
  projectId: string,
  input: { name: string; color?: string },
) => {
  const project = await findProjectInOrg(projectId, orgId);
  if (!project) throw new ApiError(404, "Project not found");

  const membership = await getProjectMembership(userId, projectId);
  if (membership?.role !== "ADMIN") {
    throw new ApiError(403, "Only project admins can create board columns");
  }

  const name = input.name.trim();
  if (!name) throw new ApiError(400, "Column name is required");
  if (isBacklogColumnName(name)) {
    throw new ApiError(400, '"Backlog" column already exists');
  }

  const existing = await prisma.boardColumn.findFirst({
    where: {
      projectId,
      name: { equals: name, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
      _count: { select: { tickets: true } },
    },
  });

  if (existing) {
    const { _count, ...rest } = existing;
    return { ...rest, ticketCount: _count.tickets, alreadyExisted: true };
  }

  const last = await prisma.boardColumn.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (last?.position ?? 0) + 1000;

  const newColumn = await prisma.boardColumn.create({
    data: {
      name,
      color: input.color?.trim() || DEFAULT_COLUMN_COLOR,
      projectId,
      position,
    },
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
      _count: { select: { tickets: true } },
    },
  });

  const { _count, ...rest } = newColumn;
  return { ...rest, ticketCount: _count.tickets, alreadyExisted: false };
};

const DEFAULT_WORKFLOW_COLUMNS = DEFAULT_BOARD_COLUMNS.filter(
  (column) => column.name !== BACKLOG_COLUMN_NAME,
);

// When every workflow column was removed, re-seed the default board set (not Backlog).
export const ensureDefaultWorkflowColumns = async (projectId: string) => {
  const nonBacklogCount = await prisma.boardColumn.count({
    where: {
      projectId,
      name: { not: BACKLOG_COLUMN_NAME },
    },
  });

  if (nonBacklogCount > 0) return false;

  await prisma.boardColumn.createMany({
    data: DEFAULT_WORKFLOW_COLUMNS.map((column) => ({
      projectId,
      name: column.name,
      color: column.color,
      position: column.position,
    })),
  });

  return true;
};

export const updateProjectBoardColumn = async (
  orgId: string,
  userId: string,
  projectId: string,
  columnId: string,
  input: { name: string; color: string },
) => {
  const project = await findProjectInOrg(projectId, orgId);
  if (!project) throw new ApiError(404, "Project not found");

  const membership = await getProjectMembership(userId, projectId);
  if (membership?.role !== "ADMIN") {
    throw new ApiError(403, "Only project admins can update board columns");
  }

  const existing = await prisma.boardColumn.findUnique({
    where: { id: columnId, projectId },
    select: { name: true },
  });

  if (!existing) throw new ApiError(404, "Column not found");

  if (isBacklogColumnName(existing.name)) {
    throw new ApiError(400, "The Backlog column cannot be edited");
  }

  const name = input.name.trim();
  if (isBacklogColumnName(name)) {
    throw new ApiError(400, '"Backlog" column already exists');
  }

  const updated = await prisma.boardColumn.update({
    where: { id: columnId, projectId },
    data: { name, color: input.color },
    select: {
      id: true,
      name: true,
      color: true,
      position: true,
      _count: { select: { tickets: true } },
    },
  });

  const { _count, ...rest } = updated;
  return { ...rest, ticketCount: _count.tickets };
};

export type DeleteBoardColumnOptions = {
  ticketDisposition?: "move" | "delete_all";
  targetColumnId?: string;
};

export const deleteProjectBoardColumn = async (
  orgId: string,
  userId: string,
  projectId: string,
  columnId: string,
  options: DeleteBoardColumnOptions = {},
) => {
  const project = await findProjectInOrg(projectId, orgId);
  if (!project) throw new ApiError(404, "Project not found");

  const membership = await getProjectMembership(userId, projectId);
  if (membership?.role !== "ADMIN") {
    throw new ApiError(403, "Only project admins can delete board columns");
  }

  const column = await prisma.boardColumn.findUnique({
    where: { id: columnId, projectId },
    select: {
      id: true,
      name: true,
      _count: { select: { tickets: true } },
    },
  });

  if (!column) throw new ApiError(404, "Column not found");

  if (isBacklogColumnName(column.name)) {
    throw new ApiError(400, '"Backlog" column cannot be deleted');
  }

  const ticketCount = column._count.tickets;

  if (ticketCount > 0) {
    const { ticketDisposition, targetColumnId } = options;

    if (!ticketDisposition) {
      throw new ApiError(
        409,
        `This column has ${ticketCount} ticket(s). Move them to another column or delete them with the column.`,
      );
    }

    if (ticketDisposition === "move") {
      if (!targetColumnId) {
        throw new ApiError(400, "Choose a column to move tickets into");
      }

      if (targetColumnId === columnId) {
        throw new ApiError(400, "Choose a different target column");
      }

      const target = await prisma.boardColumn.findFirst({
        where: { id: targetColumnId, projectId },
        select: { id: true, name: true },
      });

      if (!target) throw new ApiError(404, "Target column not found");

      await prisma.$transaction(async (tx) => {
        const tickets = await tx.ticket.findMany({
          where: { columnId: column.id },
          orderBy: { position: "asc" },
          select: { id: true },
        });

        let position = await tx.ticket
          .aggregate({
            where: { columnId: target.id },
            _max: { position: true },
          })
          .then((result) => result._max.position ?? 0);

        for (const ticket of tickets) {
          position += 1000;
          await tx.ticket.update({
            where: { id: ticket.id },
            data: { columnId: target.id, position },
          });
        }

        await tx.boardColumn.delete({ where: { id: columnId, projectId } });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.ticket.deleteMany({ where: { columnId: column.id } });
        await tx.boardColumn.delete({ where: { id: columnId, projectId } });
      });
    }
  } else {
    await prisma.boardColumn.delete({ where: { id: columnId, projectId } });
  }

  const restoredDefaultColumns = await ensureDefaultWorkflowColumns(projectId);

  return {
    restoredDefaultColumns,
  };
};
