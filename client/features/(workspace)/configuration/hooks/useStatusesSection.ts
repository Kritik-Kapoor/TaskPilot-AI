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
import { useWorkspaceUi } from "@/providers/workspaceUiProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { projectBoardQueryPrefix } from "@/features/(workspace)/board/api";
import { DeleteBoardColumnPayload } from "../types";

const BACKLOG_NAME_LOWER = "backlog";

const useStatusesSection = (canManage: boolean) => {
  const queryClient = useQueryClient();
  const { activeProject } = useProject();
  const { openConfiguration } = useWorkspaceUi();
  const projectId = activeProject?.id ?? "";

  const [draftName, setDraftName] = useState("");
  const [columnPendingDelete, setColumnPendingDelete] =
    useState<BoardColumn | null>(null);
  const [draftColor, setDraftColor] = useState("#6366f1");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6366f1");

  const {
    data: boardColumns,
    isPending: isLoading,
    isError: boardColumnsError,
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
    queryClient.invalidateQueries({
      queryKey: projectBoardQueryPrefix(projectId),
    });
  }, [projectId, queryClient]);

  const focusStatusesTab = useCallback(() => {
    openConfiguration("statuses");
  }, [openConfiguration]);

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
      focusStatusesTab();
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
      focusStatusesTab();
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
    mutationFn: ({
      columnId,
      payload,
    }: {
      columnId: string;
      payload?: DeleteBoardColumnPayload;
    }) => deleteBoardColumn(projectId, columnId, payload),
    onSuccess: (result, { columnId }) => {
      queryClient.setQueryData(
        projectColumnsQueryKey(projectId),
        (old: { columns: BoardColumn[] } | undefined) => {
          if (!old) return old;
          return { columns: old.columns.filter((c) => c.id !== columnId) };
        },
      );
      setColumnPendingDelete(null);
      if (result.restoredDefaultColumns) {
        toast.message(
          "All workflow columns were removed. Default board columns were restored.",
        );
      } else {
        toast.success("Column deleted");
      }
      focusStatusesTab();
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
      focusStatusesTab();
    },
  });

  const columns = useMemo(
    () => boardColumns?.columns ?? [],
    [boardColumns?.columns],
  );

  const isBacklog = useCallback(
    (name: string) => name.toLowerCase() === BACKLOG_NAME_LOWER,
    [],
  );

  const requestDeleteColumn = useCallback(
    (column: BoardColumn) => {
      if (isBacklog(column.name)) return;
      focusStatusesTab();
      setColumnPendingDelete(column);
    },
    [focusStatusesTab, isBacklog],
  );

  const confirmDeleteColumn = useCallback(
    (payload?: DeleteBoardColumnPayload) => {
      if (!columnPendingDelete) return;
      deleteMutation.mutate({
        columnId: columnPendingDelete.id,
        payload,
      });
    },
    [columnPendingDelete, deleteMutation],
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
      if (type === "edit") {
        const target = columns.find((c) => c.id === columnId);
        if (target && isBacklog(target.name)) {
          toast.error("The Backlog column cannot be edited");
          return;
        }
        updateMutation.mutate({
          columnId: columnId!,
          payload: { name, color: editColor },
        });
      }
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
      columns,
      isBacklog,
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
    isError: boardColumnsError,
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
        ? (deleteMutation.variables?.columnId ?? null)
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
      requestDeleteColumn,
      confirmDeleteColumn,
      cancelDeleteColumn: () => setColumnPendingDelete(null),
    },
    columnPendingDelete,
  };
};

export default useStatusesSection;
