import { apiFetch } from "@/lib/utils/apiClient";
import type { Project } from "./types";

export const getProjects = () =>
  apiFetch<Project[]>("/organization/projects", {
    fallbackErrorMessage: "Failed to fetch projects",
  });
