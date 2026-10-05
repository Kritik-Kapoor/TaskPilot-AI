"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AiAction, AiMessage } from "./types";
import { aiChatHistoryQueryKey, fetchAiChatHistory, sendAiChat } from "./api";

type AiChatContextType = {
  messages: AiMessage[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  send: (text: string) => Promise<void>;
  pendingAction: AiAction | null;
  consumeAction: () => void;
};

const AiChatContext = createContext<AiChatContextType | null>(null);

let nextId = 0;
const uid = () => `ai-${++nextId}`;

type MessageListState = {
  projectId: string;
  messages: AiMessage[];
};

export function AiChatProvider({
  children,
  projectId,
}: {
  children: ReactNode;
  projectId: string | null;
}) {
  const queryClient = useQueryClient();
  const [messageList, setMessageList] = useState<MessageListState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<AiAction | null>(null);

  const { data: historyData, isPending: isHistoryLoading } = useQuery({
    queryKey: aiChatHistoryQueryKey(projectId ?? ""),
    queryFn: () => fetchAiChatHistory(projectId!),
    enabled: Boolean(projectId),
  });

  const messages = useMemo(() => {
    const base = historyData?.messages ?? [];
    if (messageList && messageList.projectId === projectId) {
      return [...base, ...messageList.messages];
    }
    return base;
  }, [historyData?.messages, messageList, projectId]);

  const consumeAction = useCallback(() => setPendingAction(null), []);

  const send = useCallback(
    async (text: string) => {
      if (!projectId || !text.trim()) return;

      const userMsg: AiMessage = {
        id: uid(),
        role: "user",
        content: text.trim(),
      };
      setMessageList({ projectId, messages: [userMsg] });
      setIsLoading(true);

      try {
        const data = await sendAiChat(text.trim(), projectId);

        const actions = data.actions ?? [];

        const assistantMsg: AiMessage = {
          id: uid(),
          role: "assistant",
          content: data.message,
          actions,
        };

        setMessageList({ projectId, messages: [userMsg, assistantMsg] });

        await queryClient.invalidateQueries({
          queryKey: aiChatHistoryQueryKey(projectId),
        });
        setMessageList(null);

        if (actions.length > 0) {
          const types = new Set(actions.map((action) => action.type));

          if (types.has("create_issue_type")) {
            queryClient.invalidateQueries({ queryKey: ["ticket-types"] });
          }
          if (
            types.has("create_ticket") ||
            types.has("assign_tickets") ||
            types.has("apply_labels") ||
            types.has("remove_labels") ||
            types.has("move_tickets") ||
            types.has("create_board_column") ||
            types.has("delete_board_column")
          ) {
            queryClient.invalidateQueries({ queryKey: ["project-board"] });
          }
          if (
            types.has("create_board_column") ||
            types.has("delete_board_column")
          ) {
            queryClient.invalidateQueries({ queryKey: ["project-columns"] });
          }
          if (
            types.has("create_label") ||
            types.has("apply_labels") ||
            types.has("remove_labels") ||
            types.has("delete_label")
          ) {
            queryClient.invalidateQueries({ queryKey: ["project-labels"] });
          }

          const uiAction =
            actions.find((action) => action.type === "navigate_page") ??
            actions.find((action) => action.type === "navigate_board") ??
            actions.find((action) => action.type === "open_config") ??
            actions.find((action) => action.type === "create_issue_type") ??
            actions.find((action) => action.type === "create_board_column") ??
            actions.find((action) => action.type === "create_ticket") ??
            actions.find((action) => action.type === "create_label") ??
            actions.find((action) => action.type === "move_tickets") ??
            null;

          if (uiAction) setPendingAction(uiAction);
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
        setMessageList({ projectId, messages: [userMsg, errorMsg] });
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
        isHistoryLoading: Boolean(projectId) && isHistoryLoading,
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
