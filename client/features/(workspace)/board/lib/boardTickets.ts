import type { TicketStatus } from "@/features/(onboarding)/lib/mock-app";
import { BOARD_COLUMNS } from "../constants";
import type { BoardTicket, ColumnIdByStatus } from "../types";
import { getPositionBetween } from "./ticketPosition";

export type TicketsByColumn = Record<TicketStatus, BoardTicket[]>;

export const groupTicketsByStatus = (
  tickets: BoardTicket[],
): TicketsByColumn => {
  const grouped = Object.fromEntries(
    BOARD_COLUMNS.map((status) => [status, [] as BoardTicket[]]),
  ) as TicketsByColumn;

  for (const ticket of tickets) {
    if (ticket.status in grouped) {
      grouped[ticket.status].push(ticket);
    }
  }

  for (const status of BOARD_COLUMNS) {
    grouped[status].sort((left, right) => left.position - right.position);
  }

  return grouped;
};

export const computeRepositionPayload = (
  ticketsByColumn: TicketsByColumn,
  columnIdByStatus: ColumnIdByStatus,
  ticketId: string,
) => {
  for (const status of BOARD_COLUMNS) {
    const tickets = ticketsByColumn[status];
    const index = tickets.findIndex((ticket) => ticket.id === ticketId);

    if (index === -1) continue;

    const prev = tickets[index - 1];
    const next = tickets[index + 1];

    return {
      columnId: columnIdByStatus[status],
      position: getPositionBetween(
        prev?.position ?? null,
        next?.position ?? null,
      ),
    };
  }

  return null;
};

export const applyBoardTicketUpdate = (
  ticketsByColumn: TicketsByColumn,
  updatedTicket: BoardTicket,
): TicketsByColumn => {
  const next = Object.fromEntries(
    BOARD_COLUMNS.map((status) => [
      status,
      (ticketsByColumn[status] ?? []).filter(
        (ticket) => ticket.id !== updatedTicket.id,
      ),
    ]),
  ) as TicketsByColumn;

  if (updatedTicket.status in next) {
    next[updatedTicket.status] = [...next[updatedTicket.status], updatedTicket];
    next[updatedTicket.status].sort(
      (left, right) => left.position - right.position,
    );
  }

  return next;
};
