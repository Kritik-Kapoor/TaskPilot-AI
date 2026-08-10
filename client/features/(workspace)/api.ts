import { apiFetch } from "@/lib/utils/apiClient";
import type { ProjectRole } from "@/features/(auth)/types";
import type { Project, ProjectLabel, ProjectMember } from "./types";

export const projectMembersQueryKey = (projectId: string) =>
  ["project-members", projectId] as const;

export const getProjects = () =>
  apiFetch<Project[]>("/organization/projects", {
    fallbackErrorMessage: "Failed to fetch projects",
  });

export const getProjectMembers = (projectId: string) =>
  apiFetch<ProjectMember[]>(`/project/${projectId}/members`, {
    fallbackErrorMessage: "Failed to fetch project members",
  });

export type UpdateProjectMemberPayload = {
  username: string;
  role: ProjectRole;
};

export const updateProjectMember = (
  projectId: string,
  userId: string,
  payload: UpdateProjectMemberPayload,
) =>
  apiFetch<ProjectMember>(`/project/${projectId}/members/${userId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update member",
  });

export const removeProjectMember = (projectId: string, userId: string) =>
  apiFetch<{ id: string } | null>(`/project/${projectId}/members/${userId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to remove member",
  });

export const getProjectLabels = (projectId: string) =>
  apiFetch<ProjectLabel[]>(`/project/${projectId}/labels`, {
    fallbackErrorMessage: "Failed to fetch project labels",
  });

export type UpdateProjectPayload = {
  name?: string;
  description?: string | null;
};

export const updateProject = (projectId: string, payload: UpdateProjectPayload) =>
  apiFetch<Project>(`/project/${projectId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update project",
  });

export const deleteProject = (projectId: string) =>
  apiFetch<null>(`/project/${projectId}`, {
    method: "DELETE",
    fallbackErrorMessage: "Failed to delete project",
  });

export const sendProjectJoinRequest = (projectId: string) =>
  apiFetch<null>(`/project/${projectId}/join-request`, {
    method: "POST",
    fallbackErrorMessage: "Failed to send join request",
  });
