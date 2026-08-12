import { apiFetch } from "@/lib/utils/apiClient";
import type { ProjectBacklogResponse } from "./types";

export const projectBacklogQueryKey = (projectId: string) =>
  ["project-backlog", projectId] as const;

export const getProjectBacklog = (projectId: string) =>
  apiFetch<ProjectBacklogResponse>(`/ticket/project-backlog/${projectId}`, {
    fallbackErrorMessage: "Failed to fetch backlog tickets",
  });
