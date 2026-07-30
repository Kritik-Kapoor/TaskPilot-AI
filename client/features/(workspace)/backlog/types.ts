import type { BoardColumn, Ticket } from "../board/types";

export type ProjectBacklogResponse = {
  column: BoardColumn;
  tickets: Ticket[];
  totalTicketCount: number;
};
