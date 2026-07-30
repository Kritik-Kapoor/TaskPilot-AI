"use client";

import { getUserRoleInProject } from "@/features/(auth)/api";
import type { ProjectRole } from "@/features/(auth)/types";
import { getProjectLabels, getProjectMembers, getProjects } from "@/features/(workspace)/api";
import {
  getProjectIdFromParams,
  PROJECT_ID_PARAM,
  withProjectId,
} from "@/features/(workspace)/lib/projectUrl";
import type { Project, ProjectLabel, ProjectMember } from "@/features/(workspace)/types";
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
import { ProjectProviderFatalError } from "../components/common/ProjectProviderFeedback";

const PROJECT_ROLES: ProjectRole[] = ["ADMIN", "MEMBER", "VIEWER"];

type ProjectContextType = {
  projects: Project[];
  activeProject: Project | null;
  projectMembers: ProjectMember[] | undefined;
  projectLabels: ProjectLabel[];
  projectRole: ProjectRole;
  isProjectAdmin: boolean;
  buildWorkspacePath: (path: string) => string;
  handleSetActiveProjectId: (projectId: string) => void;
  isLoading: boolean;
  isRoleLoading: boolean;
  isMembersLoading: boolean;
  isLabelsLoading: boolean;
  showRoleWarning: boolean;
  retryProjectRole: () => void;
  isProjectRoleRetrying: boolean;
};

const isValidProjectRole = (value: unknown): value is ProjectRole =>
  typeof value === "string" && PROJECT_ROLES.includes(value as ProjectRole);

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlProjectId = getProjectIdFromParams(searchParams);

  const {
    data: projects = [],
    isPending: isProjectsPending,
    isError: isProjectsError,
    isFetching: isProjectsFetching,
    refetch: refetchProjects,
  } = useQuery({
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
    data: projectMembers,
    isPending: isProjectMembersPending,
    isError: isProjectMembersError,
    isFetching: isProjectMembersFetching,
    refetch: refetchProjectMembers,
  } = useQuery({
    queryKey: ["project-members", resolvedProjectId],
    queryFn: () => getProjectMembers(resolvedProjectId!),
    enabled: !!resolvedProjectId,
  });

  const {
    data: projectLabels = [],
    isPending: isProjectLabelsPending,
  } = useQuery({
    queryKey: ["project-labels", resolvedProjectId],
    queryFn: () => getProjectLabels(resolvedProjectId!),
    enabled: !!resolvedProjectId,
  });

  const {
    data: projectRole = placeholderRole,
    isPending: isProjectRolePending,
    isError: isProjectRoleError,
    isFetching: isProjectRoleFetching,
    refetch: refetchProjectRole,
  } = useQuery({
    queryKey: ["project-role", resolvedProjectId],
    queryFn: () => getUserRoleInProject(resolvedProjectId!),
    enabled: !!resolvedProjectId,
    placeholderData: placeholderRole,
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

  const hasCriticalError = isProjectsError || isProjectMembersError;

  const showRoleWarning =
    !hasCriticalError && !!resolvedProjectId && isProjectRoleError;

  const effectiveProjectRole = showRoleWarning ? "VIEWER" : projectRole;

  const value = useMemo(
    () => ({
      projects,
      activeProject,
      projectMembers,
      projectLabels,
      projectRole: effectiveProjectRole,
      isProjectAdmin: effectiveProjectRole === "ADMIN",
      buildWorkspacePath,
      handleSetActiveProjectId,
      isLoading: isProjectsPending,
      isRoleLoading: !!resolvedProjectId && isProjectRolePending,
      isMembersLoading: !!resolvedProjectId && isProjectMembersPending,
      isLabelsLoading: !!resolvedProjectId && isProjectLabelsPending,
      showRoleWarning,
      retryProjectRole: refetchProjectRole,
      isProjectRoleRetrying: isProjectRoleFetching,
    }),
    [
      activeProject,
      buildWorkspacePath,
      effectiveProjectRole,
      handleSetActiveProjectId,
      isProjectLabelsPending,
      isProjectMembersPending,
      isProjectRoleFetching,
      isProjectRolePending,
      isProjectsPending,
      projectLabels,
      projectMembers,
      projects,
      resolvedProjectId,
      showRoleWarning,
      refetchProjectRole,
    ],
  );

  if (isProjectsError) {
    return (
      <ProjectProviderFatalError
        title="Couldn't load projects"
        description="We couldn't fetch your workspace projects. Check your connection and try again."
        onRetry={() => void refetchProjects()}
        isRetrying={isProjectsFetching}
      />
    );
  }

  if (isProjectMembersError) {
    return (
      <ProjectProviderFatalError
        title="Couldn't load project members"
        description="We couldn't fetch members for this project. Check your connection and try again."
        onRetry={() => void refetchProjectMembers()}
        isRetrying={isProjectMembersFetching}
      />
    );
  }

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
