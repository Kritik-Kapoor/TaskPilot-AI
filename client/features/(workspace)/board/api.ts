import { apiFetch } from "@/lib/utils/apiClient";
import type {
  BoardColumn,
  BoardFilters,
  CreateTicketPayload,
  ProjectBoardResponse,
  RepositionTicketPayload,
  Ticket,
} from "./types";
import { buildBoardFilterSearchParams } from "./lib/utils/boardTickets";

export const projectBoardQueryKey = (
  projectId: string,
  filters?: BoardFilters,
) => ["project-board", projectId, filters ?? null] as const;

export const projectColumnsQueryKey = (projectId: string) =>
  ["project-columns", projectId] as const;

export const getProjectBoard = (projectId: string, filters?: BoardFilters) => {
  const search = filters
    ? buildBoardFilterSearchParams(filters).toString()
    : "";
  const path = `/ticket/project-board/${projectId}${search ? `?${search}` : ""}`;

  return apiFetch<ProjectBoardResponse>(path, {
    fallbackErrorMessage: "Failed to fetch board tickets",
  });
};

export const getProjectColumns = (projectId: string) =>
  apiFetch<{ columns: BoardColumn[] }>(`/ticket/project-columns/${projectId}`, {
    fallbackErrorMessage: "Failed to fetch project columns",
  });

export const createTicket = (payload: CreateTicketPayload) =>
  apiFetch<Ticket>("/ticket", {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Failed to create ticket",
  });

export const repositionTicket = (
  projectId: string,
  ticketId: string,
  payload: RepositionTicketPayload,
) =>
  apiFetch<{ ticket: Ticket }>(`/ticket/${projectId}/${ticketId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to move ticket",
  });
