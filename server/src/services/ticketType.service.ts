import { prisma } from "../config/db.js";
import { DEFAULT_ISSUE_TYPES } from "../constants/ticketTypes.js";
import type { Prisma } from "../generated/prisma/client.js";
import {
  findProjectInOrg,
  getProjectMembership,
  isDuplicateNameError,
} from "./project.service.js";
import { TicketServiceError } from "./ticket.service.js";

type TransactionClient = Prisma.TransactionClient;

export const seedDefaultIssueTypes = (
  tx: TransactionClient | typeof prisma,
  projectId: string,
) =>
  tx.issueType.createMany({
    data: DEFAULT_ISSUE_TYPES.map((issueType) => ({
      projectId,
      key: issueType.key,
      color: issueType.color,
    })),
    skipDuplicates: true,
  });

export const ensureProjectIssueTypes = async (projectId: string) => {
  const count = await prisma.issueType.count({ where: { projectId } });
  if (count > 0) return;
  await seedDefaultIssueTypes(prisma, projectId);
};

export const getIssueTypesWithCounts = async (projectId: string) => {
  await ensureProjectIssueTypes(projectId);

  const issueTypes = await prisma.issueType.findMany({
    where: { projectId },
    select: {
      id: true,
      key: true,
      color: true,
      isEnabled: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return issueTypes.map(({ _count, ...issueType }) => ({
    ...issueType,
    ticketCount: _count.tickets,
  }));
};

export const createIssueType = async (
  orgId: string,
  userId: string,
  projectId: string,
  input: { key: string; color: string },
) => {
  const project = await findProjectInOrg(projectId, orgId);

  if (!project) {
    throw new TicketServiceError(404, "Project not found");
  }

  const membership = await getProjectMembership(userId, projectId);

  if (membership?.role !== "ADMIN") {
    throw new TicketServiceError(
      403,
      "Only project admins can create issue types",
    );
  }

  try {
    const newType = await prisma.issueType.create({
      data: {
        key: input.key.toLowerCase(),
        color: input.color,
        projectId,
        isEnabled: true,
      },
      select: {
        id: true,
        key: true,
        color: true,
        isEnabled: true,
        _count: { select: { tickets: true } },
      },
    });

    const { _count, ...rest } = newType;
    return { ...rest, ticketCount: _count.tickets };
  } catch (error) {
    if (isDuplicateNameError(error)) {
      throw new TicketServiceError(
        409,
        "An issue type with that key already exists",
      );
    }
    throw error;
  }
};
