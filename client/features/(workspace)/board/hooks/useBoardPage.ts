"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { useDebounced } from "@/lib/hooks/useDebounced";
import { useProject } from "@/providers/projectProvider";
import { move } from "@dnd-kit/helpers";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useCreateTicket from "../../hooks/useCreateTicket";
import {
  getProjectBoard,
  projectBoardQueryKey,
  projectBoardQueryPrefix,
  projectColumnsQueryKey,
  repositionTicket,
} from "../api";
import {
  computeRepositionPayload,
  findTicketLocation,
  getColumnIds,
  toTicketsByColumn,
  type TicketsByColumn,
} from "../lib/utils/boardTickets";
import type { RepositionResult } from "../lib/utils/boardTickets";
import {
  type BoardFilters,
  type Ticket,
  type ProjectBoardResponse,
} from "../types";

export type BoardColumnData = {
  id: string;
  name: string;
  color: string | null;
  items: Array<{
    ticket: TicketsByColumn[string][number];
    dndIndex: number;
  }>;
};

export type BoardFilterFormTypes = ReturnType<
  typeof useBoardPage
>["state"]["filterForm"];

const defaultFilters: BoardFilters = {
  query: "",
  assignee: [],
  priority: "all",
  type: "all",
  labels: [],
};

const hasActiveBoardFilters = (filters: BoardFilters) =>
  Boolean(
    filters.query.trim() ||
    filters.assignee.length > 0 ||
    filters.priority !== "all" ||
    filters.type !== "all" ||
    filters.labels.length > 0,
  );

const optimisticReposition = (
  old: ProjectBoardResponse,
  ticketId: string,
  result: RepositionResult,
): ProjectBoardResponse => {
  let movedTicket: Ticket | null = null;

  const columnsWithout = old.columns.map((col) => ({
    ...col,
    tickets: col.tickets.filter((t) => {
      if (t.id === ticketId) {
        movedTicket = { ...t };
        return false;
      }
      return true;
    }),
  }));

  if (!movedTicket) return old;

  const updated: Ticket = {
    ...(movedTicket as Ticket),
    columnId: result.columnId,
    position: result.position,
  };

  return {
    ...old,
    columns: columnsWithout.map((col) => {
      if (col.id !== result.columnId) return col;
      const tickets = [...col.tickets, updated].sort(
        (a, b) => a.position - b.position,
      );
      return { ...col, tickets };
    }),
  };
};

const optimisticCreate = (
  old: ProjectBoardResponse,
  ticket: Ticket,
  columnId: string,
): ProjectBoardResponse => ({
  ...old,
  totalTicketCount: old.totalTicketCount + 1,
  filteredTicketCount: old.filteredTicketCount + 1,
  columns: old.columns.map((col) => {
    if (col.id !== columnId) return col;
    const tickets = [...col.tickets, ticket].sort(
      (a, b) => a.position - b.position,
    );
    return { ...col, tickets };
  }),
});

const useBoardPage = () => {
  const queryClient = useQueryClient();
  const { activeProject, projectMembers } = useProject();

  const [filters, setFilters] = useState<BoardFilters>(defaultFilters);
  const debouncedQuery = useDebounced(filters.query, 300);

  const apiFilters = useMemo<BoardFilters>(
    () => ({
      ...filters,
      query: debouncedQuery,
    }),
    [filters, debouncedQuery],
  );

  const filterForm = useAppForm({
    defaultValues: defaultFilters,
    listeners: {
      onChange: ({ formApi }) => {
        setFilters({ ...formApi.state.values });
      },
    },
  });

  const projectId = activeProject?.id ?? "";
  const boardQueryKey = projectBoardQueryKey(projectId, apiFilters);

  const {
    data: boardData,
    isPending: isBoardLoading,
    isFetching: isBoardFetching,
    isError: isBoardError,
  } = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => getProjectBoard(projectId, apiFilters),
    enabled: Boolean(projectId),
    placeholderData: keepPreviousData,
  });

  const columnIds = useMemo(
    () => (boardData ? getColumnIds(boardData.columns) : []),
    [boardData],
  );

  const totalCount = boardData?.totalTicketCount ?? 0;
  const filteredCount = boardData?.filteredTicketCount ?? 0;
  const isFiltering = hasActiveBoardFilters(apiFilters);

  const defaultColumnId = useMemo(() => {
    if (!boardData?.columns.length) return "";

    return (
      boardData.columns.find((col) => col.name === "Todo")?.id ??
      boardData.columns[0].id
    );
  }, [boardData]);

  const boardDataRef = useRef(boardData);
  const columnIdsRef = useRef(columnIds);

  const [dndBoard, setDndBoardState] = useState<TicketsByColumn | null>(null);
  const dndBoardRef = useRef<TicketsByColumn | null>(null);
  const dragSnapshotRef = useRef<TicketsByColumn | null>(null);

  const setDndBoard = (value: TicketsByColumn | null) => {
    dndBoardRef.current = value;
    setDndBoardState(value);
  };

  const repositionMutation = useMutation({
    mutationFn: (vars: { ticketId: string; result: RepositionResult }) =>
      repositionTicket(projectId, vars.ticketId, {
        columnId: vars.result.columnId,
        position: vars.result.position,
      }),

    onMutate: (vars) => {
      queryClient.cancelQueries({
        queryKey: projectBoardQueryPrefix(projectId),
      });

      const snapshot =
        queryClient.getQueryData<ProjectBoardResponse>(boardQueryKey);

      if (snapshot) {
        queryClient.setQueryData<ProjectBoardResponse>(
          boardQueryKey,
          (old) => old && optimisticReposition(old, vars.ticketId, vars.result),
        );
      }

      return { snapshot };
    },

    onError: (error, _, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueryData(boardQueryKey, ctx.snapshot);
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to move ticket",
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectBoardQueryPrefix(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectColumnsQueryKey(projectId),
      });
    },
  });

  const repositionMutationRef = useRef(repositionMutation);

  useEffect(() => {
    boardDataRef.current = boardData;
    columnIdsRef.current = columnIds;
    repositionMutationRef.current = repositionMutation;
  }, [boardData, columnIds, repositionMutation]);

  const {
    form: createTicketForm,
    isOpen: isCreateTicketOpen,
    isSubmitting: isSubmittingCreateTicket,
    open: openCreateTicketDialog,
    close: closeCreateTicketDialog,
  } = useCreateTicket({
    columnId: defaultColumnId,
    onCreated: (ticket) => {
      queryClient.cancelQueries({
        queryKey: projectBoardQueryPrefix(projectId),
      });
      queryClient.setQueryData<ProjectBoardResponse>(
        boardQueryKey,
        (old) => old && optimisticCreate(old, ticket, ticket.columnId),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: projectBoardQueryPrefix(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectColumnsQueryKey(projectId),
      });
    },
  });

  const dndHandlers = useMemo(
    () => ({
      onDragStart: () => {
        if (isFiltering) return;

        const data = boardDataRef.current;
        if (!data) return;

        const current = toTicketsByColumn(data.columns);
        dragSnapshotRef.current = current;
        setDndBoard(current);
      },

      onDragOver: (event: DragOverEvent) => {
        if (isFiltering) return;

        const prev = dndBoardRef.current;
        if (!prev) return;
        const next = move(prev, event) as TicketsByColumn;
        dndBoardRef.current = next;
        setDndBoardState(next);
      },

      onDragEnd: (event: DragEndEvent) => {
        if (isFiltering) return;

        if (event.canceled) {
          setDndBoard(null);
          dragSnapshotRef.current = null;
          return;
        }

        const finalBoard = dndBoardRef.current;
        const ticketId = String(event.operation.source?.id ?? "");

        if (ticketId && finalBoard) {
          const data = boardDataRef.current;
          const before = findTicketLocation(
            dragSnapshotRef.current ??
              (data ? toTicketsByColumn(data.columns) : {}),
            columnIdsRef.current,
            ticketId,
          );
          const after = findTicketLocation(
            finalBoard,
            columnIdsRef.current,
            ticketId,
          );

          const noOp =
            before &&
            after &&
            before.columnId === after.columnId &&
            before.index === after.index;

          if (!noOp) {
            const result = computeRepositionPayload(
              finalBoard,
              columnIdsRef.current,
              ticketId,
            );

            if (result) {
              repositionMutationRef.current.mutate({ ticketId, result });
            }
          }
        }

        setDndBoard(null);
        dragSnapshotRef.current = null;
      },
    }),
    [isFiltering],
  );

  const columns = useMemo<BoardColumnData[]>(() => {
    if (!boardData) return [];

    return boardData.columns.map((column) => {
      const allInColumn = dndBoard?.[column.id] ?? column.tickets;

      return {
        id: column.id,
        name: column.name,
        color: column.color,
        items: allInColumn.map((ticket, dndIndex) => ({ ticket, dndIndex })),
      };
    });
  }, [boardData, dndBoard]);

  const activeFilterCount =
    (filters.assignee.length > 0 ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0) +
    (filters.labels.length > 0 ? 1 : 0) +
    (filters.query.trim() ? 1 : 0);

  const clearFilters = useCallback(() => {
    filterForm.reset();
    setFilters(defaultFilters);
  }, [filterForm]);

  const toggleAssigneeFilter = useCallback(
    (memberId: string) => {
      const current = filterForm.getFieldValue("assignee");
      filterForm.setFieldValue(
        "assignee",
        current.includes(memberId)
          ? current.filter((id) => id !== memberId)
          : [...current, memberId],
      );
    },
    [filterForm],
  );

  const applyFilters = useCallback(
    (incoming: Partial<BoardFilters>) => {
      const merged = { ...defaultFilters, ...incoming };
      setFilters(merged);
      filterForm.reset();
      for (const [key, value] of Object.entries(merged)) {
        filterForm.setFieldValue(key as keyof BoardFilters, value as never);
      }
    },
    [filterForm],
  );

  return {
    state: {
      filterForm,
      members: projectMembers ?? [],
      filteredCount,
      totalCount,
      activeFilterCount,
      isFiltering,
      columns,
      isCreateTicketOpen,
      isSubmittingCreateTicket,
      createTicketForm,
      activeProject,
      isBoardLoading,
      isBoardFetching,
      isBoardError,
      isMinimalBoard: boardData?.isMinimalBoard ?? false,
    },
    actions: {
      clearFilters,
      applyFilters,
      toggleAssigneeFilter,
      openCreateTicketDialog,
      closeCreateTicketDialog,
      dndHandlers,
    },
  };
};

export default useBoardPage;
