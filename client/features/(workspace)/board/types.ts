import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  TicketType,
} from "@/features/(onboarding)/lib/mock-app";

export type BoardTicket = Ticket & {
  columnId: string;
  position: number;
};

export type ApiTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ApiTicketType = "STORY" | "BUG" | "TASK" | "EPIC";

export type ApiBoardColumn = {
  id: string;
  name: TicketStatus;
  color: string | null;
  position: number;
};

export type ApiTicket = {
  id: string;
  ticketKey: string;
  title: string;
  description: string | null;
  priority: ApiTicketPriority;
  type: ApiTicketType;
  position: number;
  labels: string[];
  storyPoints: number | null;
  columnId: string;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  column?: ApiBoardColumn;
  assignee?: { id: string; username: string } | null;
};

export type ProjectBoardResponse = {
  columns: ApiBoardColumn[];
  tickets: ApiTicket[];
};

export type CreateTicketPayload = {
  projectId: string;
  columnName: TicketStatus;
  title: string;
  description?: string;
  priority?: ApiTicketPriority;
  type?: ApiTicketType;
  assigneeId?: string | null;
  storyPoints?: number | null;
  labels?: string[];
};

export type RepositionTicketPayload = {
  columnId: string;
  position: number;
};

export type ColumnIdByStatus = Record<TicketStatus, string>;

export const PRIORITY_TO_API: Record<TicketPriority, ApiTicketPriority> = {
  Low: "LOW",
  Medium: "MEDIUM",
  High: "HIGH",
  Urgent: "URGENT",
};

export const TYPE_TO_API: Record<TicketType, ApiTicketType> = {
  Story: "STORY",
  Bug: "BUG",
  Task: "TASK",
  Epic: "EPIC",
};

const PRIORITY_FROM_API: Record<ApiTicketPriority, TicketPriority> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const TYPE_FROM_API: Record<ApiTicketType, TicketType> = {
  STORY: "Story",
  BUG: "Bug",
  TASK: "Task",
  EPIC: "Epic",
};

export const mapApiTicketToBoardTicket = (ticket: ApiTicket): BoardTicket => ({
  id: ticket.id,
  key: ticket.ticketKey,
  title: ticket.title,
  description: ticket.description ?? undefined,
  status: ticket.column?.name ?? "todo",
  priority: PRIORITY_FROM_API[ticket.priority],
  type: TYPE_FROM_API[ticket.type],
  assigneeId: ticket.assigneeId,
  projectId: ticket.projectId,
  labels: ticket.labels,
  points: ticket.storyPoints ?? undefined,
  updated: ticket.updatedAt,
  columnId: ticket.columnId,
  position: ticket.position,
});

export const buildColumnIdByStatus = (
  columns: ApiBoardColumn[],
): ColumnIdByStatus => {
  const map = {} as ColumnIdByStatus;

  for (const column of columns) {
    map[column.name] = column.id;
  }

  return map;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);
