import { ProjectLabel } from "../types";

export type ConfigurationSection = "labels" | "statuses" | "types";

export type TicketType = {
  id: string;
  key: string;
  color: string;
  isEnabled: boolean;
  ticketCount: number;
};

export type LabelPayload = {
  name: string;
  color: string;
};

export type LabelConfiguration = Omit<ProjectLabel, "ticketCount"> & {
  ticketCount: number;
};

export type DeleteBoardColumnPayload = {
  ticketDisposition?: "move" | "delete_all";
  targetColumnId?: string;
};
