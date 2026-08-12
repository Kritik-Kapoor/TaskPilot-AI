"use client";

import {
  getProjectColumns,
  projectColumnsQueryKey,
} from "@/features/(workspace)/board/api";
import type { BoardColumn } from "@/features/(workspace)/board/types";
import {
  createBoardColumn,
  deleteBoardColumn,
  moveBoardColumn,
  updateBoardColumn,
} from "@/features/(workspace)/configuration/api";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const BACKLOG_NAME_LOWER = "backlog";

const useStatusesSection = (canManage: boolean) => {
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const projectId = activeProject?.id ?? "";

  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState("#6366f1");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const {
    data,
    isPending: isLoading,
    isError,
  } = useQuery({
    queryKey: projectColumnsQueryKey(projectId),
    queryFn: () => getProjectColumns(projectId),
    enabled: Boolean(projectId),
  });

  const startEditing = useCallback((column: BoardColumn) => {
    setEditingColumnId(column.id);
    setEditName(column.name);
    setEditColor(column.color ?? "#6366f1");
  }, []);

  const cancelEditing = useCallback(() => setEditingColumnId(null), []);

  const invalidateColumns = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: projectColumnsQueryKey(projectId),
    });
  }, [projectId, queryClient]);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) =>
      createBoardColumn(projectId, payload),
    onSuccess: (newColumn) => {
      queryClient.setQueryData(
        projectColumnsQueryKey(projectId),
        (old: { columns: BoardColumn[] } | undefined) => {
          if (!old) return { columns: [newColumn] };
          return { columns: [...old.columns, newColumn] };
        },
      );
      setDraftName("");
      setDraftColor("#6366f1");
      toast.success("Column created");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create column",
      );
    },
    onSettled: () => {
      invalidateColumns();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      columnId,
      payload,
    }: {
      columnId: string;
      payload: { name?: string; color?: string };
    }) => updateBoardColumn(projectId, columnId, payload),
    onSuccess: (updatedColumn) => {
      queryClient.setQueryData(
        projectColumnsQueryKey(projectId),
        (old: { columns: BoardColumn[] } | undefined) => {
          if (!old) return old;
          return {
            columns: old.columns.map((c) =>
              c.id === updatedColumn.id ? { ...c, ...updatedColumn } : c,
            ),
          };
        },
      );
      setEditingColumnId(null);
      toast.success("Column updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update column",
      );
    },
    onSettled: () => {
      invalidateColumns();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (columnId: string) => deleteBoardColumn(projectId, columnId),
    onSuccess: (_, columnId) => {
      queryClient.setQueryData(
        projectColumnsQueryKey(projectId),
        (old: { columns: BoardColumn[] } | undefined) => {
          if (!old) return old;
          return { columns: old.columns.filter((c) => c.id !== columnId) };
        },
      );
      toast.success("Column deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete column",
      );
    },
    onSettled: () => {
      invalidateColumns();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({
      columnId,
      newPosition,
    }: {
      columnId: string;
      newPosition: number;
    }) => moveBoardColumn(projectId, columnId, newPosition),
    onSuccess: ({ column }) => {
      queryClient.setQueryData(
        projectColumnsQueryKey(projectId),
        (old: { columns: BoardColumn[] } | undefined) => {
          if (!old) return old;
          return {
            columns: old.columns.map((c) =>
              c.id === column.id ? { ...c, position: column.position } : c,
            ),
          };
        },
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to move column",
      );
    },
    onSettled: () => {
      invalidateColumns();
    },
  });

  const columns = data?.columns ?? [];

  const isBacklog = useCallback(
    (name: string) => name.toLowerCase() === BACKLOG_NAME_LOWER,
    [],
  );

  const handleSubmit = useCallback(
    (type: "create" | "edit", columnId?: string) => {
      if (!canManage || !projectId) return;
      const name = type === "create" ? draftName.trim() : editName.trim();
      if (name.toLowerCase() === BACKLOG_NAME_LOWER) {
        toast.error('Cannot create a column named "Backlog"');
        return;
      }
      if (type === "create") createMutation.mutate({ name, color: draftColor });
      if (type === "edit")
        updateMutation.mutate({
          columnId: columnId!,
          payload: { name, color: editColor },
        });
    },
    [
      canManage,
      createMutation,
      draftColor,
      draftName,
      editColor,
      editName,
      projectId,
      updateMutation,
    ],
  );

  const handleReorder = useCallback(
    (columnId: string, newPosition: number) => {
      if (!canManage) return;
      reorderMutation.mutate({ columnId, newPosition });
    },
    [canManage, reorderMutation],
  );

  return {
    columns,
    isLoading,
    isError,
    canManage,
    isBacklog,
    handleReorder,
    isReordering: reorderMutation.isPending,
    state: {
      draftName,
      draftColor,
      editingColumnId,
      editName,
      editColor,
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      deletingColumnId: deleteMutation.isPending
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
      handleSubmit,
      deleteColumn: deleteMutation.mutate,
    },
  };
};

export default useStatusesSection;
