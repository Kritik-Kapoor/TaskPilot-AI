import { apiFetch } from "@/lib/utils/apiClient";
import type {
  ApiTicket,
  CreateTicketPayload,
  ProjectBoardResponse,
  RepositionTicketPayload,
} from "./types";

export const getProjectBoard = (projectId: string) =>
  apiFetch<ProjectBoardResponse>(`/ticket/project-board/${projectId}`, {
    fallbackErrorMessage: "Failed to fetch board tickets",
  });

export const createTicket = (payload: CreateTicketPayload) =>
  apiFetch<{ ticket: ApiTicket }>("/ticket", {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Failed to create ticket",
  }).then(({ ticket }) => ticket);

export const repositionTicket = (
  projectId: string,
  ticketId: string,
  payload: RepositionTicketPayload,
) =>
  apiFetch<{ ticket: ApiTicket }>(`/ticket/${projectId}/${ticketId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to move ticket",
  }).then(({ ticket }) => ticket);
