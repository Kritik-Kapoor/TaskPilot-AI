import { prisma } from "../config/db.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { CreateCommentInput } from "../schemas/comment.schema.js";
import { findProjectInOrg, getProjectMembership } from "./project.service.js";
import { ApiError } from "../utils/apiResponse.js";

const commentSelect = {
  id: true,
  ticketId: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
    },
  },
} as const;

const assertTicketAccess = async (
  userId: string,
  orgId: string,
  projectId: string,
  ticketId: string,
) => {
  const project = await findProjectInOrg(projectId, orgId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const membership = await getProjectMembership(userId, projectId);

  if (!membership) {
    throw new ApiError(403, "You are not a member of this project");
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, projectId },
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

  return membership;
};

export const getTicketComments = async (
  orgId: string,
  projectId: string,
  userId: string,
  ticketId: string,
) => {
  await assertTicketAccess(userId, orgId, projectId, ticketId);

  return prisma.comment.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
};

export const createTicketComment = async (
  orgId: string,
  projectId: string,
  userId: string,
  ticketId: string,
  input: CreateCommentInput,
) => {
  const membership = await assertTicketAccess(
    userId,
    orgId,
    projectId,
    ticketId,
  );

  if (membership.role === "VIEWER") {
    throw new ApiError(
      403,
      "You do not have permission to comment on tickets in this project",
    );
  }

  return prisma.comment.create({
    data: {
      ticketId,
      userId,
      content: input.content as Prisma.InputJsonValue,
    },
    select: commentSelect,
  });
};
