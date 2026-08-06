"use client";

import useAuth from "@/lib/hooks/useAuth";
import { getProjects } from "@/features/(workspace)/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getOrganizationUsers,
  organizationUsersQueryKey,
  updateOrganizationUser,
} from "../api";
import { createUserManagementTableColumns } from "../components/UserManagementTableColumns";
import type { OrganizationUser, UpdateOrganizationUserPayload } from "../types";

const useUserManagementPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(
    null,
  );

  const canManage =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";
  const isOrgOwner = user?.organizationRole === "OWNER";

  const {
    data: users = [],
    isPending: isUsersLoading,
    isError: isUsersError,
  } = useQuery({
    queryKey: organizationUsersQueryKey,
    queryFn: getOrganizationUsers,
    enabled: canManage,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["organization-projects"],
    queryFn: getProjects,
    enabled: canManage,
  });

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((orgUser) => {
      const roleLabel = orgUser.isOwner
        ? "owner"
        : (orgUser.organizationRole ?? "").toLowerCase();
      const projectNames = orgUser.projects
        .map((project) => project.projectName)
        .join(" ")
        .toLowerCase();

      return (
        orgUser.username.toLowerCase().includes(normalizedQuery) ||
        orgUser.email.toLowerCase().includes(normalizedQuery) ||
        roleLabel.includes(normalizedQuery) ||
        projectNames.includes(normalizedQuery)
      );
    });
  }, [query, users]);

  const columns = useMemo(
    () => createUserManagementTableColumns((orgUser) => setSelectedUser(orgUser)),
    [],
  );

  const updateMutation = useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UpdateOrganizationUserPayload;
    }) => updateOrganizationUser(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<OrganizationUser[]>(
        organizationUsersQueryKey,
        (current = []) =>
          current.map((orgUser) =>
            orgUser.id === updatedUser.id ? updatedUser : orgUser,
          ),
      );

      void queryClient.invalidateQueries({ queryKey: ["project-members"] });

      setSelectedUser(null);
      toast.success(`${updatedUser.username} was updated`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user",
      );
    },
  });

  const saveUser = useCallback(
    (payload: UpdateOrganizationUserPayload) => {
      if (!selectedUser) return;

      updateMutation.mutate({
        userId: selectedUser.id,
        payload,
      });
    },
    [selectedUser, updateMutation],
  );

  return {
    state: {
      query,
      users: filteredUsers,
      totalCount: users.length,
      filteredCount: filteredUsers.length,
      columns,
      projects,
      selectedUser,
      isSettingsOpen: selectedUser !== null,
      canManage,
      isOrgOwner,
      isUsersLoading,
      isUsersError,
      isSaving: updateMutation.isPending,
    },
    actions: {
      setQuery,
      closeSettings: () => setSelectedUser(null),
      saveUser,
    },
  };
};

export default useUserManagementPage;
