import type {
  ApiColumnWithTickets,
  Ticket,
  RepositionTicketPayload,
  BoardFilters,
} from "../../types";
import { getPositionBetween } from "../../lib/utils/ticketPosition";

export type TicketsByColumn = Record<string, Ticket[]>;

export const toTicketsByColumn = (
  columns: ApiColumnWithTickets[],
): TicketsByColumn =>
  Object.fromEntries(columns.map((column) => [column.id, column.tickets]));

export const getColumnIds = (columns: ApiColumnWithTickets[]) =>
  columns.map((column) => column.id);

export type RepositionResult = RepositionTicketPayload;

export const computeRepositionPayload = (
  ticketsByColumn: TicketsByColumn,
  columnIds: string[],
  ticketId: string,
): RepositionResult | null => {
  for (const columnId of columnIds) {
    const tickets = ticketsByColumn[columnId] ?? [];
    const index = tickets.findIndex((ticket) => ticket.id === ticketId);

    if (index === -1) continue;

    const prev = tickets[index - 1];
    const next = tickets[index + 1];

    return {
      columnId,
      position: getPositionBetween(
        prev?.position ?? null,
        next?.position ?? null,
      ),
    };
  }

  return null;
};

export const findTicketLocation = (
  board: TicketsByColumn,
  columnIds: string[],
  ticketId: string,
): { columnId: string; index: number } | null => {
  for (const columnId of columnIds) {
    const index = (board[columnId] ?? []).findIndex(
      (ticket) => ticket.id === ticketId,
    );
    if (index !== -1) return { columnId, index };
  }
  return null;
};

export const buildBoardFilterSearchParams = (filters: BoardFilters) => {
  const params = new URLSearchParams();

  const query = filters.query.trim();
  if (query) params.set("query", query);
  filters.assignee.forEach((assigneeId) => params.append("assignee", assigneeId));
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.type !== "all") params.set("type", filters.type);
  filters.labels.forEach((labelId) => params.append("labels", labelId));

  return params;
};
