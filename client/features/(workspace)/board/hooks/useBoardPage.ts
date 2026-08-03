"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { useProject } from "@/providers/projectProvider";
import { move } from "@dnd-kit/helpers";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import useCreateTicket from "../../hooks/useCreateTicket";
import { getProjectBoard, repositionTicket } from "../api";
import {
  computeRepositionPayload,
  findTicketLocation,
  getColumnIds,
  toTicketsByColumn,
  type TicketsByColumn,
} from "../lib/utils/boardTickets";
import type { RepositionResult } from "../lib/utils/boardTickets";
import {
  type Ticket,
  type TicketPriority,
  type TicketType,
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

type BoardFilters = {
  query: string;
  assignee: string;
  priority: TicketPriority | "all";
  type: TicketType | "all";
};

const matchesFilter = (
  ticket: TicketsByColumn[string][number],
  params: BoardFilters,
): boolean => {
  const { query, assignee, priority, type } = params;

  if (
    query &&
    !(
      ticket.title.toLowerCase().includes(query.toLowerCase()) ||
      ticket.ticketKey.toLowerCase().includes(query.toLowerCase())
    )
  ) {
    return false;
  }
  if (assignee !== "all") {
    if (assignee === "unassigned" && ticket.assigneeId) return false;
    if (assignee !== "unassigned" && ticket.assigneeId !== assignee)
      return false;
  }
  if (priority !== "all" && ticket.priority !== priority) return false;
  if (type !== "all" && ticket.type !== type) return false;

  return true;
};

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
  columns: old.columns.map((col) => {
    if (col.id !== columnId) return col;
    const tickets = [...col.tickets, ticket].sort(
      (a, b) => a.position - b.position,
    );
    return { ...col, tickets };
  }),
});

const defaultFilters: BoardFilters = {
  query: "",
  assignee: "all",
  priority: "all",
  type: "all",
};

const useBoardPage = () => {
  const queryClient = useQueryClient();
  const { activeProject, projectMembers } = useProject();

  const [filters, setFilters] = useState<BoardFilters>(defaultFilters);

  const filterForm = useAppForm({
    defaultValues: defaultFilters,
    listeners: {
      onChange: ({ formApi }) => {
        setFilters({ ...formApi.state.values });
      },
    },
  });

  const boardQueryKey = ["project-board", activeProject?.id] as const;

  const {
    data: boardData,
    isPending: isBoardLoading,
    isError: isBoardError,
  } = useQuery({
    queryKey: boardQueryKey,
    queryFn: () => getProjectBoard(activeProject!.id),
    enabled: !!activeProject?.id,
  });

  const columnIds = useMemo(
    () => (boardData ? getColumnIds(boardData.columns) : []),
    [boardData],
  );

  const totalCount = boardData?.totalTicketCount ?? 0;

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
      repositionTicket(activeProject!.id, vars.ticketId, {
        columnId: vars.result.columnId,
        position: vars.result.position,
      }),

    onMutate: (vars) => {
      queryClient.cancelQueries({ queryKey: boardQueryKey });

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
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
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
      queryClient.cancelQueries({ queryKey: boardQueryKey });
      queryClient.setQueryData<ProjectBoardResponse>(
        boardQueryKey,
        (old) => old && optimisticCreate(old, ticket, ticket.columnId),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardQueryKey });
    },
  });

  const dndHandlers = useMemo(
    () => ({
      onDragStart: () => {
        const data = boardDataRef.current;
        if (!data) return;

        const current = toTicketsByColumn(data.columns);
        dragSnapshotRef.current = current;
        setDndBoard(current);
      },

      onDragOver: (event: DragOverEvent) => {
        const prev = dndBoardRef.current;
        if (!prev) return;
        const next = move(prev, event) as TicketsByColumn;
        dndBoardRef.current = next;
        setDndBoardState(next);
      },

      onDragEnd: (event: DragEndEvent) => {
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
    [],
  );

  const columns = useMemo<BoardColumnData[]>(() => {
    if (!boardData) return [];

    return boardData.columns.map((column) => {
      const allInColumn = dndBoard?.[column.id] ?? column.tickets;
      const items = allInColumn.reduce<BoardColumnData["items"]>(
        (acc, ticket, dndIndex) => {
          if (matchesFilter(ticket, filters)) {
            acc.push({ ticket, dndIndex });
          }
          return acc;
        },
        [],
      );

      return {
        id: column.id,
        name: column.name,
        color: column.color,
        items,
      };
    });
  }, [boardData, dndBoard, filters]);

  const filteredCount = useMemo(
    () => columns.reduce((sum, col) => sum + col.items.length, 0),
    [columns],
  );

  const activeFilterCount =
    (filters.assignee !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.type !== "all" ? 1 : 0);

  const clearFilters = useCallback(() => {
    filterForm.reset();
    setFilters(defaultFilters);
  }, [filterForm]);

  const toggleAssigneeFilter = useCallback(
    (memberId: string) => {
      const current = filterForm.getFieldValue("assignee");
      filterForm.setFieldValue(
        "assignee",
        current === memberId ? "all" : memberId,
      );
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
      columns,
      isCreateTicketOpen,
      isSubmittingCreateTicket,
      createTicketForm,
      activeProject,
      isBoardLoading,
      isBoardError,
    },
    actions: {
      clearFilters,
      toggleAssigneeFilter,
      openCreateTicketDialog,
      closeCreateTicketDialog,
      dndHandlers,
    },
  };
};

export default useBoardPage;
