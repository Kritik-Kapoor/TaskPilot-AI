import { apiFetch } from "@/lib/utils/apiClient";
import { getClientTimeZone } from "@/lib/utils/timeZone";
import type { AiChatResponse, AiMessage } from "./types";

export const aiChatHistoryQueryKey = (projectId: string) =>
  ["ai-chat-history", projectId] as const;

export const fetchAiChatHistory = (projectId: string) =>
  apiFetch<{ messages: AiMessage[] }>(`/ai/chat/history/${projectId}`, {
    fallbackErrorMessage: "Failed to load chat history",
  });

export const sendAiChat = (message: string, projectId: string) =>
  apiFetch<AiChatResponse>("/ai/chat", {
    method: "POST",
    body: { message, projectId, timeZone: getClientTimeZone() },
    fallbackErrorMessage: "Failed to get AI response",
  });
