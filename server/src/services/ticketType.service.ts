import { prisma } from "../config/db.js";
import { DEFAULT_ISSUE_TYPES } from "../constants/ticketTypes.js";
import type { Prisma } from "../generated/prisma/client.js";

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
