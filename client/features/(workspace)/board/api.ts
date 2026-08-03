import { apiFetch } from "@/lib/utils/apiClient";
import type {
  CreateTicketPayload,
  ProjectBoardResponse,
  RepositionTicketPayload,
  Ticket,
} from "./types";

export const getProjectBoard = (projectId: string) =>
  apiFetch<ProjectBoardResponse>(`/ticket/project-board/${projectId}`, {
    fallbackErrorMessage: "Failed to fetch board tickets",
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
