"use client";

import {
  createTicketType,
  deleteTicketType,
  getTicketTypes,
  ticketTypesQueryKey,
  updateTicketType,
} from "@/features/(workspace)/configuration/api";
import type { TicketType } from "@/features/(workspace)/configuration/types";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const useTypesSection = (canManage: boolean) => {
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? null;

  const {
    data: ticketTypes = [],
    isPending: isLoading,
    isError,
  } = useQuery({
    queryKey: ticketTypesQueryKey(projectId ?? ""),
    queryFn: () => getTicketTypes(projectId!),
    enabled: Boolean(projectId),
  });

  const [draftKey, setDraftKey] = useState("");
  const [draftColor, setDraftColor] = useState("#6366f1");

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const startEditing = useCallback((type: TicketType) => {
    setEditingTypeId(type.id);
    setEditKey(type.key);
    setEditColor(type.color);
  }, []);

  const cancelEditing = useCallback(() => setEditingTypeId(null), []);

  const updateCache = useCallback(
    (updatedType: TicketType) => {
      if (!projectId) return;
      queryClient.setQueryData<TicketType[]>(
        ticketTypesQueryKey(projectId),
        (current = []) =>
          current.map((t) => (t.id === updatedType.id ? updatedType : t)),
      );
    },
    [projectId, queryClient],
  );

  const toggleMutation = useMutation({
    mutationFn: ({
      typeId,
      isEnabled,
    }: {
      typeId: string;
      isEnabled: boolean;
    }) => updateTicketType(projectId!, typeId, { isEnabled }),
    onSuccess: (updatedType) => updateCache(updatedType),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update issue type",
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: { key: string; color: string }) =>
      createTicketType(projectId!, payload),
    onSuccess: (newType) => {
      if (!projectId) return;
      queryClient.setQueryData<TicketType[]>(
        ticketTypesQueryKey(projectId),
        (current = []) => [...current, newType],
      );
      setDraftKey("");
      setDraftColor("#6366f1");
      toast.success("Issue type created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create issue type",
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: ({
      typeId,
      payload,
    }: {
      typeId: string;
      payload: { key?: string; color?: string };
    }) => updateTicketType(projectId!, typeId, payload),
    onSuccess: (updatedType) => {
      updateCache(updatedType);
      setEditingTypeId(null);
      toast.success("Issue type updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update issue type",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (typeId: string) => deleteTicketType(projectId!, typeId),
    onSuccess: (_, typeId) => {
      if (!projectId) return;
      queryClient.setQueryData<TicketType[]>(
        ticketTypesQueryKey(projectId),
        (current = []) => current.filter((t) => t.id !== typeId),
      );
      toast.success("Issue type deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete issue type",
      );
    },
  });

  const normalizedDraftKey = draftKey.trim().toLowerCase();
  const draftExists = ticketTypes.some((t) => t.key === normalizedDraftKey);

  const submitCreate = useCallback(() => {
    if (!canManage || !projectId || !normalizedDraftKey) return;
    if (draftExists) {
      toast.error(`Issue type "${normalizedDraftKey}" already exists`);
      return;
    }
    createMutation.mutate({ key: normalizedDraftKey, color: draftColor });
  }, [
    canManage,
    createMutation,
    draftColor,
    draftExists,
    normalizedDraftKey,
    projectId,
  ]);

  const submitEdit = useCallback(
    (typeId: string) => {
      const key = editKey.trim().toLowerCase();
      if (!key) return;
      editMutation.mutate({ typeId, payload: { key, color: editColor } });
    },
    [editColor, editKey, editMutation],
  );

  const toggleTypeEnabled = useCallback(
    (typeId: string, isEnabled: boolean) => {
      toggleMutation.mutate({ typeId, isEnabled });
    },
    [toggleMutation],
  );

  return {
    ticketTypes,
    isLoading,
    isError,
    canManage,
    state: {
      draftKey,
      draftColor,
      editingTypeId,
      editKey,
      editColor,
      isCreating: createMutation.isPending,
      isEditing: editMutation.isPending,
      deletingTypeId: deleteMutation.isPending
        ? deleteMutation.variables
        : null,
      updatingTypeId: toggleMutation.isPending
        ? toggleMutation.variables?.typeId
        : null,
    },
    actions: {
      setDraftKey,
      setDraftColor,
      setEditKey,
      setEditColor,
      startEditing,
      cancelEditing,
      submitCreate,
      submitEdit,
      toggleTypeEnabled,
      deleteType: deleteMutation.mutate,
    },
  };
};

export default useTypesSection;
