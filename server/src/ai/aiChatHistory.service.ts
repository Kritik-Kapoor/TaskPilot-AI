import { prisma } from "../config/db.js";
import {
  AiChatMessageRole,
  type Prisma,
} from "../generated/prisma/client.js";
import { assertProjectAccess } from "../services/project.service.js";
import type { AiAction } from "./ai.types.js";

export const AI_CHAT_HISTORY_LIMIT = 50;

export type StoredAiChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AiAction[];
  createdAt: string;
};

const trimHistoryToLimit = async (
  userId: string,
  projectId: string,
  limit: number,
) => {
  const rows = await prisma.aiChatMessage.findMany({
    where: { userId, projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const excess = rows.length - limit;
  if (excess <= 0) return;

  const idsToDelete = rows.slice(0, excess).map((row) => row.id);
  await prisma.aiChatMessage.deleteMany({
    where: { id: { in: idsToDelete } },
  });
};

const toStoredMessage = (row: {
  id: string;
  role: AiChatMessageRole;
  content: string;
  actions: unknown;
  createdAt: Date;
}): StoredAiChatMessage => ({
  id: row.id,
  role: row.role === AiChatMessageRole.USER ? "user" : "assistant",
  content: row.content,
  ...(row.actions ? { actions: row.actions as AiAction[] } : {}),
  createdAt: row.createdAt.toISOString(),
});

export const listAiChatHistory = async (
  userId: string,
  orgId: string,
  projectId: string,
): Promise<StoredAiChatMessage[]> => {
  await assertProjectAccess(userId, orgId, projectId);

  const rows = await prisma.aiChatMessage.findMany({
    where: { userId, projectId },
    orderBy: { createdAt: "desc" },
    take: AI_CHAT_HISTORY_LIMIT,
    select: {
      id: true,
      role: true,
      content: true,
      actions: true,
      createdAt: true,
    },
  });

  return rows.reverse().map(toStoredMessage);
};

export const appendAiChatTurn = async (input: {
  userId: string;
  orgId: string;
  projectId: string;
  userContent: string;
  assistantContent: string;
  actions?: AiAction[];
}): Promise<void> => {
  await assertProjectAccess(input.userId, input.orgId, input.projectId);

  await prisma.$transaction(async (tx) => {
    await tx.aiChatMessage.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        role: AiChatMessageRole.USER,
        content: input.userContent,
      },
    });

    await tx.aiChatMessage.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        role: AiChatMessageRole.ASSISTANT,
        content: input.assistantContent,
        ...(input.actions?.length
          ? { actions: input.actions as Prisma.InputJsonValue }
          : {}),
      },
    });
  });

  void trimHistoryToLimit(
    input.userId,
    input.projectId,
    AI_CHAT_HISTORY_LIMIT,
  ).catch((error) => {
    console.error("Failed to trim AI chat history:", error);
  });
};

export type AiChatHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export const loadAiChatHistoryForModel = async (
  userId: string,
  orgId: string,
  projectId: string,
): Promise<AiChatHistoryTurn[]> => {
  const messages = await listAiChatHistory(userId, orgId, projectId);
  return messages.map(({ role, content }) => ({ role, content }));
};
