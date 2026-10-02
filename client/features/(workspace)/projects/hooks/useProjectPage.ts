"use client";

import { sendProjectJoinRequest } from "@/features/(workspace)/api";
import type { JoinRequestStatus } from "@/features/(onboarding)/types";
import type { Project } from "@/features/(workspace)/types";
import useAuth from "@/lib/hooks/useAuth";
import { formatDisplayName } from "@/lib/utils/common";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export type ProjectFilter = "all" | "mine" | "available";

const useProjectPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { projects, isLoading, buildWorkspacePath, handleSetActiveProjectId } =
    useProject();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [pendingRequestProjectIds, setPendingRequestProjectIds] = useState<
    Set<string>
  >(new Set());
  const [requestingProjectId, setRequestingProjectId] = useState<string | null>(
    null,
  );

  const canCreateProject =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";

  const joinMutation = useMutation({
    mutationFn: sendProjectJoinRequest,
    onMutate: (projectId) => {
      setRequestingProjectId(projectId);
    },
    onSuccess: (_, projectId) => {
      const project = projects.find((item) => item.id === projectId);

      setPendingRequestProjectIds((current) => new Set(current).add(projectId));
      toast.success(
        `Join request sent for ${formatDisplayName(project?.projectName ?? "project")}`,
      );
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to send join request",
      );
    },
    onSettled: () => {
      setRequestingProjectId(null);
    },
  });

  const getEffectiveJoinRequestStatus = useCallback(
    (
      projectId: string,
      joinRequestStatus: JoinRequestStatus | null,
    ): JoinRequestStatus | null => {
      if (pendingRequestProjectIds.has(projectId)) return "PENDING";
      return joinRequestStatus;
    },
    [pendingRequestProjectIds],
  );

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "mine" && project.isJoined) ||
        (filter === "available" && !project.isJoined);

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      return (
        project.projectName.toLowerCase().includes(normalizedQuery) ||
        project.projectKey.toLowerCase().includes(normalizedQuery) ||
        project.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, projects, query]);

  const requestJoin = useCallback(
    (projectId: string) => {
      joinMutation.mutate(projectId);
    },
    [joinMutation],
  );

  const openProject = useCallback(
    (project: Project) => {
      handleSetActiveProjectId(project.id);
      router.push(buildWorkspacePath("/board"));
    },
    [buildWorkspacePath, handleSetActiveProjectId, router],
  );

  return {
    state: {
      projects: filteredProjects,
      totalCount: projects.length,
      isLoading,
      query,
      filter,
      requestingProjectId,
      canCreateProject,
      getEffectiveJoinRequestStatus,
    },
    actions: {
      setQuery,
      setFilter,
      requestJoin,
      openProject,
    },
  };
};

export default useProjectPage;
