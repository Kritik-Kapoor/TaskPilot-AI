import type { BoardColumn, Ticket } from "../board/types";

export type ProjectBacklogResponse = {
  column: BoardColumn | null;
  tickets: Ticket[];
  totalTicketCount: number;
};
