import { apiFetch } from "@/lib/utils/apiClient";
import type { Project, ProjectLabel, ProjectMember } from "./types";

export const getProjects = () =>
  apiFetch<Project[]>("/organization/projects", {
    fallbackErrorMessage: "Failed to fetch projects",
  });

export const getProjectMembers = (projectId: string) =>
  apiFetch<ProjectMember[]>(`/project/${projectId}/members`, {
    fallbackErrorMessage: "Failed to fetch project members",
  });

export const getProjectLabels = (projectId: string) =>
  apiFetch<ProjectLabel[]>(`/project/${projectId}/labels`, {
    fallbackErrorMessage: "Failed to fetch project labels",
  });
