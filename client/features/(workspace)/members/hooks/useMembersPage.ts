"use client";

import type { ProjectRole } from "@/features/(auth)/types";
import {
  getProjectMembers,
  projectMembersQueryKey,
  removeProjectMember,
  updateProjectMember,
} from "@/features/(workspace)/api";
import type { ProjectMember } from "@/features/(workspace)/types";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { createMembersTableColumns } from "../components/MembersTableColumns";

const useMembersPage = () => {
  const queryClient = useQueryClient();
  const { activeProject, isProjectAdmin } = useProject();

  const projectId = activeProject?.id ?? "";

  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: members = [],
    isPending: isMembersLoading,
    isError: isMembersError,
  } = useQuery({
    queryKey: projectMembersQueryKey(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: Boolean(projectId),
  });

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return members;

    return members.filter(
      (member) =>
        member.username.toLowerCase().includes(normalizedQuery) ||
        member.email.toLowerCase().includes(normalizedQuery) ||
        member.role.toLowerCase().includes(normalizedQuery),
    );
  }, [members, query]);

  const columns = useMemo(
    () => createMembersTableColumns((member) => setSelectedMember(member)),
    [],
  );

  const updateMutation = useMutation({
    mutationFn: (payload: {
      memberId: string;
      username: string;
      role: ProjectRole;
    }) =>
      updateProjectMember(projectId, payload.memberId, {
        username: payload.username,
        role: payload.role,
      }),
    onSuccess: (updatedMember) => {
      queryClient.setQueryData<ProjectMember[]>(
        projectMembersQueryKey(projectId),
        (current = []) =>
          current.map((member) =>
            member.id === updatedMember.id ? updatedMember : member,
          ),
      );
      setSelectedMember(null);
      toast.success("Member updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update member",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (memberId: string) => removeProjectMember(projectId, memberId),
    onSuccess: (_, memberId) => {
      queryClient.setQueryData<ProjectMember[]>(
        projectMembersQueryKey(projectId),
        (current = []) => current.filter((member) => member.id !== memberId),
      );
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove member",
      );
    },
  });

  const saveMember = useCallback(
    (payload: { username: string; role: ProjectRole }) => {
      if (!selectedMember) return;

      updateMutation.mutate({
        memberId: selectedMember.id,
        username: payload.username,
        role: payload.role,
      });
    },
    [selectedMember, updateMutation],
  );

  const confirmDeleteMember = useCallback(() => {
    if (!selectedMember) return;
    deleteMutation.mutate(selectedMember.id);
  }, [deleteMutation, selectedMember]);

  return {
    state: {
      query,
      members: filteredMembers,
      totalCount: members.length,
      filteredCount: filteredMembers.length,
      columns,
      activeProject,
      isMembersLoading,
      isMembersError,
      selectedMember,
      isSettingsOpen: selectedMember !== null,
      isDeleteDialogOpen,
      canManage: isProjectAdmin,
      isSaving: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    },
    actions: {
      setQuery,
      closeSettings: () => setSelectedMember(null),
      saveMember,
      openDeleteDialog: () => setIsDeleteDialogOpen(true),
      closeDeleteDialog: () => setIsDeleteDialogOpen(false),
      confirmDeleteMember,
    },
  };
};

export default useMembersPage;
