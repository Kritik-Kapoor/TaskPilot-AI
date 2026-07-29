"use client";

import { getUserRoleInProject } from "@/features/(auth)/api";
import type { ProjectRole } from "@/features/(auth)/types";
import { getProjects } from "@/features/(workspace)/api";
import {
  getProjectIdFromParams,
  PROJECT_ID_PARAM,
  withProjectId,
} from "@/features/(workspace)/lib/projectUrl";
import type { Project } from "@/features/(workspace)/types";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

const PROJECT_ROLES: ProjectRole[] = ["ADMIN", "MEMBER", "VIEWER"];

type ProjectContextType = {
  projects: Project[];
  activeProject: Project | null;
  projectRole: ProjectRole;
  isProjectAdmin: boolean;
  buildWorkspacePath: (path: string) => string;
  handleSetActiveProjectId: (projectId: string) => void;
  isLoading: boolean;
  isRoleLoading: boolean;
};

const isValidProjectRole = (value: unknown): value is ProjectRole =>
  typeof value === "string" && PROJECT_ROLES.includes(value as ProjectRole);

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlProjectId = getProjectIdFromParams(searchParams);

  const { data: projects = [], isPending: isProjectsPending } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const resolvedProjectId = useMemo(() => {
    if (!projects.length) return urlProjectId;

    if (
      urlProjectId &&
      projects.some((project) => project.id === urlProjectId)
    ) {
      return urlProjectId;
    }

    return projects[0].id;
  }, [projects, urlProjectId]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === resolvedProjectId) ?? null,
    [projects, resolvedProjectId],
  );

  const placeholderRole = useMemo(() => {
    if (activeProject?.role && isValidProjectRole(activeProject.role)) {
      return activeProject.role;
    }

    return "VIEWER";
  }, [activeProject]);

  const {
    data: projectRole = placeholderRole,
    isPending: isProjectRolePending,
    isFetching: isProjectRoleFetching,
  } = useQuery({
    queryKey: ["project-role", resolvedProjectId],
    queryFn: () => getUserRoleInProject(resolvedProjectId!),
    enabled: !!resolvedProjectId,
    placeholderData: placeholderRole,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (isProjectsPending || !resolvedProjectId) return;
    if (urlProjectId === resolvedProjectId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set(PROJECT_ID_PARAM, resolvedProjectId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [
    isProjectsPending,
    pathname,
    resolvedProjectId,
    router,
    searchParams,
    urlProjectId,
  ]);

  const handleSetActiveProjectId = useCallback(
    (projectId: string) => {
      if (!projects.some((project) => project.id === projectId)) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set(PROJECT_ID_PARAM, projectId);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, projects, router, searchParams],
  );

  const buildWorkspacePath = useCallback(
    (path: string) =>
      resolvedProjectId ? withProjectId(path, resolvedProjectId) : path,
    [resolvedProjectId],
  );

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      projectRole,
      isProjectAdmin: projectRole === "ADMIN",
      buildWorkspacePath,
      handleSetActiveProjectId,
      isLoading: isProjectsPending,
      isRoleLoading:
        !!resolvedProjectId && (isProjectRolePending || isProjectRoleFetching),
    }),
    [
      activeProject,
      buildWorkspacePath,
      handleSetActiveProjectId,
      isProjectRoleFetching,
      isProjectRolePending,
      isProjectsPending,
      projectRole,
      projects,
      resolvedProjectId,
    ],
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }

  return context;
};
