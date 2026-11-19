import type {
  ApiColumnWithTickets,
  Ticket,
  RepositionTicketPayload,
  BoardFilters,
} from "../../types";
import { getLexoRankBetween } from "../../lib/utils/ticketPosition";

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

    const position = getLexoRankBetween(
      prev?.position ?? null,
      next?.position ?? null,
    );

    // position is null only when the server-side reindex edge case is triggered;
    // send the prev position as a hint so the server reindexes and resolves it.
    return {
      columnId,
      position: position ?? prev?.position ?? next?.position ?? "n",
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
  filters.assignee.forEach((assigneeId) =>
    params.append("assignee", assigneeId),
  );
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.type !== "all") params.set("type", filters.type);
  filters.labels.forEach((labelId) => params.append("labels", labelId));

  return params;
};
