"use client";

import {
  createLabel,
  deleteLabel,
  updateLabel,
} from "@/features/(workspace)/configuration/api";
import type { LabelConfiguration } from "@/features/(workspace)/configuration/types";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

const useLabelsSection = (canManage: boolean) => {
  const queryClient = useQueryClient();
  const { activeProject, projectLabels, isLabelsLoading } = useProject();

  const projectId = activeProject?.id ?? null;

  const labels: LabelConfiguration[] = useMemo(
    () =>
      projectLabels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        ticketCount: label.ticketCount ?? 0,
      })),
    [projectLabels],
  );

  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState("#6366f1");
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const invalidateLabels = useCallback(async () => {
    if (!projectId) return;
    await queryClient.invalidateQueries({
      queryKey: ["project-labels", projectId],
    });
  }, [projectId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      createLabel(projectId!, payload),
    onSuccess: async () => {
      setDraftName("");
      await invalidateLabels();
      toast.success("Label created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create label",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      labelId,
      payload,
    }: {
      labelId: string;
      payload: { name: string; color: string };
    }) => updateLabel(projectId!, labelId, payload),
    onSuccess: async () => {
      setEditingLabelId(null);
      await invalidateLabels();
      toast.success("Label updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update label",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (labelId: string) => deleteLabel(projectId!, labelId),
    onSuccess: async () => {
      await invalidateLabels();
      toast.success("Label deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete label",
      );
    },
  });

  const normalizedDraftName = draftName.trim().toLowerCase();
  const draftExists = useMemo(
    () => labels.some((label) => label.name === normalizedDraftName),
    [labels, normalizedDraftName],
  );

  const startEditing = useCallback((label: LabelConfiguration) => {
    setEditingLabelId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  }, []);

  const cancelEditing = useCallback(() => setEditingLabelId(null), []);

  const submitCreate = useCallback(() => {
    if (!canManage || !projectId || !normalizedDraftName) return;
    if (draftExists) {
      toast.error(`Label "${normalizedDraftName}" already exists`);
      return;
    }
    createMutation.mutate({ name: normalizedDraftName, color: draftColor });
  }, [
    canManage,
    createMutation,
    draftColor,
    draftExists,
    normalizedDraftName,
    projectId,
  ]);

  const submitEdit = useCallback(
    (labelId: string, originalName: string) => {
      const name = editName.trim().toLowerCase();
      if (!name) return;
      if (name !== originalName && labels.some((l) => l.name === name)) {
        toast.error(`Label "${name}" already exists`);
        return;
      }
      updateMutation.mutate({ labelId, payload: { name, color: editColor } });
    },
    [editColor, editName, labels, updateMutation],
  );

  return {
    state: {
      labels,
      isLoading: isLabelsLoading,
      draftName,
      draftColor,
      editingLabelId,
      editName,
      editColor,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      deletingLabelId: deleteMutation.isPending
        ? deleteMutation.variables
        : null,
    },
    actions: {
      setDraftName,
      setDraftColor,
      setEditName,
      setEditColor,
      startEditing,
      cancelEditing,
      submitCreate,
      submitEdit,
      deleteLabel: deleteMutation.mutate,
    },
  };
};

export default useLabelsSection;
