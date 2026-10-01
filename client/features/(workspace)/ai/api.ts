import { apiFetch } from "@/lib/utils/apiClient";
import { getClientTimeZone } from "@/lib/utils/timeZone";
import type { AiChatResponse } from "./types";

export const sendAiChat = (message: string, projectId: string) =>
  apiFetch<AiChatResponse>("/ai/chat", {
    method: "POST",
    body: { message, projectId, timeZone: getClientTimeZone() },
    fallbackErrorMessage: "Failed to get AI response",
  });
