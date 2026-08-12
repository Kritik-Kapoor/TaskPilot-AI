import type { JSONContent } from "@tiptap/core";
import type { TicketPriority } from "../board/types";

export type TicketComment = {
  id: string;
  ticketId: string;
  content: JSONContent;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  };
};

export type UpdateTicketPayload = {
  columnId?: string;
  title?: string;
  description?: JSONContent | null;
  priority?: TicketPriority;
  typeId?: string | null;
  assigneeId?: string | null;
  storyPoints?: number | null;
  labels?: string[];
};
