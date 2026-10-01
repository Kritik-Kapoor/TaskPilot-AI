import type { ProjectLabel } from "../types";
import type { JSONContent } from "@tiptap/core";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketIssueType = {
  id: string;
  key: string;
  color: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  ticketCount?: number;
};

export type Ticket = {
  id: string;
  ticketKey: string;
  title: string;
  description: JSONContent | null;
  priority: TicketPriority;
  typeId: string | null;
  issueType: TicketIssueType | null;
  position: number;
  labels: ProjectLabel[];
  storyPoints: number | null;
  columnId: string;
  projectId: string;
  assigneeId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; username: string } | null;
  createdBy?: { id: string; username: string } | null;
};

export type TicketDetail = Ticket & {
  column: BoardColumn;
};

export type ApiColumnWithTickets = BoardColumn & {
  tickets: Ticket[];
};

export type ProjectBoardResponse = {
  columns: ApiColumnWithTickets[];
  totalTicketCount: number;
  filteredTicketCount: number;
};

export type BoardFilters = {
  query: string;
  assignee: string[];
  priority: TicketPriority | "all";
  type: string;
  labels: string[];
};

export type CreateTicketPayload = {
  projectId: string;
  columnId: string;
  title: string;
  description?: JSONContent;
  priority?: TicketPriority;
  typeId?: string | null;
  assigneeId?: string | null;
  storyPoints?: number | null;
  labels?: string[];
};

export type RepositionTicketPayload = {
  columnId: string;
  position: number;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);
