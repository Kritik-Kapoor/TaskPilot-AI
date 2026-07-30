import type { ProjectLabel } from "../types";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TicketType = "STORY" | "BUG" | "TASK" | "EPIC";

export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  position: number;
};

export type Ticket = {
  id: string;
  ticketKey: string;
  title: string;
  description: string | null;
  priority: TicketPriority;
  type: TicketType;
  position: number;
  labels: ProjectLabel[];
  storyPoints: number | null;
  columnId: string;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; username: string } | null;
};

export type ApiColumnWithTickets = BoardColumn & {
  tickets: Ticket[];
};

export type ProjectBoardResponse = {
  columns: ApiColumnWithTickets[];
  totalTicketCount: number;
};

export type CreateTicketPayload = {
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: TicketPriority;
  type?: TicketType;
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
