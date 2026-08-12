import { apiFetch } from "@/lib/utils/apiClient";
import type { JSONContent } from "@tiptap/core";
import type { Ticket, TicketDetail } from "../board/types";
import type { TicketComment, UpdateTicketPayload } from "./types";

export const ticketQueryKey = (projectId: string, ticketId: string) =>
  ["ticket", projectId, ticketId] as const;

export const commentsQueryKey = (projectId: string, ticketId: string) =>
  ["ticket-comments", projectId, ticketId] as const;

export const getTicketById = (projectId: string, ticketId: string) =>
  apiFetch<TicketDetail>(`/ticket/${projectId}/${ticketId}`, {
    fallbackErrorMessage: "Failed to fetch ticket",
  });

export const updateTicket = (
  projectId: string,
  ticketId: string,
  payload: UpdateTicketPayload,
) =>
  apiFetch<Ticket>(`/ticket/${projectId}/${ticketId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update ticket",
  });

export const deleteTicket = (projectId: string, ticketId: string) =>
  apiFetch<{ id: string }>(`/ticket/${projectId}/${ticketId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to delete ticket",
  });

export const getTicketComments = (projectId: string, ticketId: string) =>
  apiFetch<TicketComment[]>(`/ticket/${projectId}/${ticketId}/comments`, {
    fallbackErrorMessage: "Failed to fetch comments",
  });

export const createTicketComment = (
  projectId: string,
  ticketId: string,
  content: JSONContent,
) =>
  apiFetch<TicketComment>(`/ticket/${projectId}/${ticketId}/comments`, {
    method: "POST",
    body: { content },
    fallbackErrorMessage: "Failed to add comment",
  });
