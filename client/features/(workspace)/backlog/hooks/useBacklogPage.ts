"use client";

import { useProject } from "@/providers/projectProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import useCreateTicket from "../../hooks/useCreateTicket";
import {
  getProjectColumns,
  projectBoardQueryKey,
  projectColumnsQueryKey,
} from "../../board/api";
import type { Ticket } from "../../board/types";
import { deleteTicket, updateTicket } from "../../ticket/api";
import { createBacklogTableColumns } from "../components/BacklogTableColumns";
import { getProjectBacklog, projectBacklogQueryKey } from "../lib/api";
import type { ProjectBacklogResponse } from "../types";

const optimisticCreate = (
  old: ProjectBacklogResponse,
  ticket: Ticket,
): ProjectBacklogResponse => ({
  ...old,
  totalTicketCount: old.totalTicketCount + 1,
  tickets: [...old.tickets, ticket].sort((a, b) => a.position - b.position),
});

const useBacklogPage = () => {
  const queryClient = useQueryClient();
  const { activeProject, projectMembers, projectRole, buildWorkspacePath } =
    useProject();

  const projectId = activeProject?.id ?? "";
  const canEdit = projectRole !== "VIEWER";

  const [query, setQuery] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: backlogData,
    isPending: isBacklogLoading,
    isError: isBacklogError,
  } = useQuery({
    queryKey: projectBacklogQueryKey(projectId),
    queryFn: () => getProjectBacklog(projectId),
    enabled: Boolean(projectId),
  });

  const { data: columnsData } = useQuery({
    queryKey: projectColumnsQueryKey(projectId),
    queryFn: () => getProjectColumns(projectId),
    enabled: Boolean(projectId),
  });

  const todoColumnId = useMemo(
    () => columnsData?.columns.find((column) => column.name === "Todo")?.id,
    [columnsData],
  );

  const backlogColumnId =
    columnsData?.columns.find((column) => column.name === "Backlog")?.id ?? "";

  const {
    form: createTicketForm,
    isOpen: isCreateTicketOpen,
    isSubmitting: isSubmittingCreateTicket,
    open: openCreateTicketDialog,
    close: closeCreateTicketDialog,
  } = useCreateTicket({
    columnId: backlogColumnId,
    onCreated: (ticket) => {
      const queryKey = projectBacklogQueryKey(projectId);
      queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<ProjectBacklogResponse>(
        queryKey,
        (old) => old && optimisticCreate(old, ticket),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectBacklogQueryKey(projectId),
      });
    },
  });

  const tickets = useMemo(() => {
    if (!backlogData?.tickets.length) return [];

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return backlogData.tickets;

    return backlogData.tickets.filter(
      (ticket) =>
        ticket.title.toLowerCase().includes(normalizedQuery) ||
        ticket.ticketKey.toLowerCase().includes(normalizedQuery),
    );
  }, [backlogData, query]);

  const selectedTicketIds = useMemo(
    () => Object.keys(rowSelection),
    [rowSelection],
  );

  const selectedCount = selectedTicketIds.length;

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: projectBacklogQueryKey(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: projectBoardQueryKey(projectId),
    });
  }, [projectId, queryClient]);

  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const bumpToTodoMutation = useMutation({
    mutationFn: async (ticketIds: string[]) => {
      if (!todoColumnId) {
        throw new Error("Todo column not found");
      }

      const results = await Promise.allSettled(
        ticketIds.map((ticketId) =>
          updateTicket(projectId, ticketId, { columnId: todoColumnId }),
        ),
      );

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount === results.length) {
        throw new Error("Failed to move tickets to Todo");
      }

      return { movedCount: results.length - failedCount, failedCount };
    },
    onSuccess: ({ movedCount, failedCount }) => {
      clearSelection();
      invalidateLists();

      if (failedCount > 0) {
        toast.warning(
          `Moved ${movedCount} ticket${movedCount === 1 ? "" : "s"} to Todo. ${failedCount} failed.`,
        );
        return;
      }

      toast.success(
        `Moved ${movedCount} ticket${movedCount === 1 ? "" : "s"} to Todo`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to move tickets to Todo",
      );
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async (ticketIds: string[]) => {
      const results = await Promise.allSettled(
        ticketIds.map((ticketId) => deleteTicket(projectId, ticketId)),
      );

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount === results.length) {
        throw new Error("Failed to delete tickets");
      }

      return { deletedCount: results.length - failedCount, failedCount };
    },
    onSuccess: ({ deletedCount, failedCount }) => {
      setIsDeleteDialogOpen(false);
      clearSelection();
      invalidateLists();

      if (failedCount > 0) {
        toast.warning(
          `Deleted ${deletedCount} ticket${deletedCount === 1 ? "" : "s"}. ${failedCount} failed.`,
        );
        return;
      }

      toast.success(
        `Deleted ${deletedCount} ticket${deletedCount === 1 ? "" : "s"}`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tickets",
      );
    },
  });

  const totalCount = backlogData?.totalTicketCount ?? 0;
  const filteredCount = tickets.length;

  const columns = useMemo(
    () =>
      createBacklogTableColumns(
        (ticketId) => buildWorkspacePath(`/ticket/${ticketId}`),
        { enableSelection: canEdit },
      ),
    [buildWorkspacePath, canEdit],
  );

  const bumpSelectedToTodo = useCallback(() => {
    if (!selectedTicketIds.length) return;
    bumpToTodoMutation.mutate(selectedTicketIds);
  }, [bumpToTodoMutation, selectedTicketIds]);

  const openDeleteSelectedDialog = useCallback(() => {
    if (!selectedTicketIds.length) return;
    setIsDeleteDialogOpen(true);
  }, [selectedTicketIds.length]);

  const confirmDeleteSelected = useCallback(() => {
    deleteSelectedMutation.mutate(selectedTicketIds);
  }, [deleteSelectedMutation, selectedTicketIds]);

  return {
    state: {
      query,
      tickets,
      filteredCount,
      totalCount,
      members: projectMembers ?? [],
      isCreateTicketOpen,
      isSubmittingCreateTicket,
      createTicketForm,
      activeProject,
      isBacklogLoading,
      isBacklogError,
      columns,
      rowSelection,
      selectedCount,
      canEdit,
      isBulkActionPending:
        bumpToTodoMutation.isPending || deleteSelectedMutation.isPending,
      isDeleteDialogOpen,
      isDeletingSelected: deleteSelectedMutation.isPending,
      canBumpToTodo: Boolean(todoColumnId),
    },
    actions: {
      setQuery,
      openCreateTicketDialog,
      closeCreateTicketDialog,
      setRowSelection,
      bumpSelectedToTodo,
      openDeleteSelectedDialog,
      closeDeleteSelectedDialog: () => setIsDeleteDialogOpen(false),
      confirmDeleteSelected,
      clearSelection,
    },
  };
};

export default useBacklogPage;
