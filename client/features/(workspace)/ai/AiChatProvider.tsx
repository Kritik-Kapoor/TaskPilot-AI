"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AiAction, AiMessage } from "./types";
import { sendAiChat } from "./api";

type AiChatContextType = {
  messages: AiMessage[];
  isLoading: boolean;
  send: (text: string) => Promise<void>;
  pendingAction: AiAction | null;
  consumeAction: () => void;
};

const AiChatContext = createContext<AiChatContextType | null>(null);

let nextId = 0;
const uid = () => `ai-${++nextId}`;

export function AiChatProvider({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string | null;
}) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AiAction | null>(null);

  const consumeAction = useCallback(() => setPendingAction(null), []);

  const send = useCallback(
    async (text: string) => {
      if (!projectId || !text.trim()) return;

      const userMsg: AiMessage = {
        id: uid(),
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const data = await sendAiChat(text.trim(), projectId);

        const assistantMsg: AiMessage = {
          id: uid(),
          role: "assistant",
          content: data.message,
          action: data.action,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.action) {
          if (data.action.type === "create_issue_type") {
            queryClient.invalidateQueries({ queryKey: ["ticket-types"] });
          } else if (
            data.action.type === "create_ticket" ||
            data.action.type === "assign_tickets"
          ) {
            queryClient.invalidateQueries({ queryKey: ["project-board"] });
          }
          setPendingAction(data.action);
        }
      } catch (error) {
        const errorMsg: AiMessage = {
          id: uid(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, queryClient],
  );

  return (
    <AiChatContext.Provider
      value={{
        messages,
        isLoading,
        send,
        pendingAction,
        consumeAction,
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
}

export const useAiChat = () => {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChat must be used within AiChatProvider");
  return ctx;
};
