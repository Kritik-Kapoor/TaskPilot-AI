import { apiFetch } from "@/lib/utils/apiClient";
import type { BoardColumn } from "@/features/(workspace)/board/types";
import type { LabelConfiguration, LabelPayload, TicketType } from "./types";

export const ticketTypesQueryKey = (projectId: string) =>
  ["ticket-types", projectId] as const;

export const createLabel = (projectId: string, payload: LabelPayload) =>
  apiFetch<LabelConfiguration>(`/project/${projectId}/labels`, {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Failed to create label",
  });

export const updateLabel = (
  projectId: string,
  labelId: string,
  payload: LabelPayload,
) =>
  apiFetch<LabelConfiguration>(`/project/${projectId}/labels/${labelId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update label",
  });

export const deleteLabel = (projectId: string, labelId: string) =>
  apiFetch<null>(`/project/${projectId}/labels/${labelId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to delete label",
  });

export const getTicketTypes = (projectId: string) =>
  apiFetch<TicketType[]>(`/project/${projectId}/ticket-types`, {
    fallbackErrorMessage: "Failed to fetch issue types",
  });

export const createTicketType = (
  projectId: string,
  payload: { key: string; color: string },
) =>
  apiFetch<TicketType>(`/project/${projectId}/ticket-types`, {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Failed to create issue type",
  });

export const updateTicketType = (
  projectId: string,
  typeId: string,
  payload: { isEnabled?: boolean; key?: string; color?: string },
) =>
  apiFetch<TicketType>(`/project/${projectId}/ticket-types/${typeId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update issue type",
  });

export const deleteTicketType = (projectId: string, typeId: string) =>
  apiFetch<null>(`/project/${projectId}/ticket-types/${typeId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to delete issue type",
  });

export const createBoardColumn = (
  projectId: string,
  payload: { name: string; color: string },
) =>
  apiFetch<BoardColumn>(`/project/${projectId}/board-columns`, {
    method: "POST",
    body: payload,
    fallbackErrorMessage: "Failed to create board column",
  });

export const updateBoardColumn = (
  projectId: string,
  columnId: string,
  payload: { name?: string; color?: string },
) =>
  apiFetch<BoardColumn>(`/project/${projectId}/board-columns/${columnId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update board column",
  });

export const deleteBoardColumn = (projectId: string, columnId: string) =>
  apiFetch<null>(`/project/${projectId}/board-columns/${columnId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to delete board column",
  });

export const moveBoardColumn = (
  projectId: string,
  columnId: string,
  newPosition: number,
) =>
  apiFetch<{
    column: {
      id: string;
      name: string;
      color: string | null;
      position: number;
    };
  }>(`/project/${projectId}/board-columns/reorder`, {
    method: "PATCH",
    body: { columnId, newPosition },
    fallbackErrorMessage: "Failed to move column",
  });
