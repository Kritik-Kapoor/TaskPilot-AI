"use client";

import { useAppForm } from "@/components/common/form/hooks";
import {
  MEMBERS,
  STATUS_META,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/features/(onboarding)/lib/mock-app";
import { useProject } from "@/providers/projectProvider";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createTicket, getProjectBoard, repositionTicket } from "../api";
import { BOARD_COLUMNS } from "../constants";
import {
  applyBoardTicketUpdate,
  computeRepositionPayload,
  groupTicketsByStatus,
  type TicketsByColumn,
} from "../lib/boardTickets";
import {
  buildColumnIdByStatus,
  isUuid,
  mapApiTicketToBoardTicket,
  PRIORITY_TO_API,
  TYPE_TO_API,
  type ColumnIdByStatus,
} from "../types";

export type { TicketsByColumn };

export type BoardColumnData = {
  status: TicketStatus;
  label: string;
  dotClassName: string;
  items: Array<{ ticket: TicketsByColumn[TicketStatus][number]; dndIndex: number }>;
};

const ticketTypeSchema = z.enum(["Story", "Bug", "Task", "Epic"]);

const ticketPrioritySchema = z.enum(["Urgent", "High", "Medium", "Low"]);

const createTicketFormSchema = z.object({
  type: ticketTypeSchema,
  priority: ticketPrioritySchema,
  title: z
    .string()
    .trim()
    .min(1, { message: "Title is required" })
    .max(140, { message: "Title must be 140 characters or less" }),
  description: z
    .string()
    .max(2000, { message: "Description must be 2000 characters or less" }),
  assigneeId: z.string(),
  storyPoints: z.string().superRefine((value, ctx) => {
    if (!value.trim()) return;

    const points = Number(value);
    if (!Number.isInteger(points) || points < 0 || points > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Story points must be a whole number between 0 and 100",
      });
    }
  }),
  labels: z.array(z.string()).max(8),
});

export type CreateTicketFormTypes = ReturnType<
  typeof useBoardPage
>["state"]["createTicketForm"];

type UseBoardPageOptions = {
  defaultCreateTicketStatus?: TicketStatus;
};

const findTicketLocation = (
  board: TicketsByColumn,
  ticketId: string,
): { status: TicketStatus; index: number } | null => {
  for (const status of BOARD_COLUMNS) {
    const index = board[status].findIndex((ticket) => ticket.id === ticketId);
    if (index !== -1) return { status, index };
  }

  return null;
};

const matchesFilter = (
  ticket: TicketsByColumn[TicketStatus][number],
  params: {
    query: string;
    assignee: string;
    priority: TicketPriority | "all";
    type: TicketType | "all";
  },
): boolean => {
  const { query, assignee, priority, type } = params;

  if (
    query &&
    !(
      ticket.title.toLowerCase().includes(query.toLowerCase()) ||
      ticket.key.toLowerCase().includes(query.toLowerCase())
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

const useBoardPage = ({
  defaultCreateTicketStatus = "todo",
}: UseBoardPageOptions = {}) => {
  const { activeProject } = useProject();

  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState<string>("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [type, setType] = useState<TicketType | "all">("all");
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [isSubmittingCreateTicket, setIsSubmittingCreateTicket] =
    useState(false);

  const [ticketsByColumn, setTicketsByColumn] = useState<TicketsByColumn>(() =>
    groupTicketsByStatus([]),
  );
  const snapshotRef = useRef<TicketsByColumn>(ticketsByColumn);
  const columnIdByStatusRef = useRef<ColumnIdByStatus | null>(null);

  const {
    data: boardData,
    isPending: isBoardLoading,
    isError: isBoardError,
  } = useQuery({
    queryKey: ["project-board", activeProject?.id],
    queryFn: () => getProjectBoard(activeProject!.id),
    enabled: !!activeProject?.id,
  });

  const columnIdByStatus = useMemo(
    () => (boardData ? buildColumnIdByStatus(boardData.columns) : null),
    [boardData],
  );

  useEffect(() => {
    columnIdByStatusRef.current = columnIdByStatus;
  }, [columnIdByStatus]);

  useEffect(() => {
    if (!boardData) return;

    setTicketsByColumn(
      groupTicketsByStatus(boardData.tickets.map(mapApiTicketToBoardTicket)),
    );
  }, [boardData]);

  const createTicketForm = useAppForm({
    defaultValues: {
      type: "Story" as TicketType,
      priority: "Medium" as TicketPriority,
      title: "",
      description: "",
      assigneeId: "unassigned",
      storyPoints: "",
      labels: [] as string[],
    },
    validators: {
      onSubmit: createTicketFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeProject) {
        toast.error("Select a project first");
        return;
      }

      setIsSubmittingCreateTicket(true);

      try {
        const assigneeId =
          value.assigneeId === "unassigned"
            ? null
            : isUuid(value.assigneeId)
              ? value.assigneeId
              : null;

        const created = await createTicket({
          projectId: activeProject.id,
          columnName: defaultCreateTicketStatus,
          title: value.title.trim(),
          ...(value.description.trim() && {
            description: value.description.trim(),
          }),
          priority: PRIORITY_TO_API[value.priority],
          type: TYPE_TO_API[value.type],
          assigneeId,
          storyPoints: value.storyPoints.trim()
            ? Number(value.storyPoints)
            : null,
          labels: value.labels,
        });

        const boardTicket = mapApiTicketToBoardTicket(created);

        setTicketsByColumn((current) =>
          applyBoardTicketUpdate(current, boardTicket),
        );

        toast.success(`Created ${boardTicket.key}`, {
          description: boardTicket.title,
        });

        setIsCreateTicketOpen(false);
        createTicketForm.reset();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create ticket",
        );
      } finally {
        setIsSubmittingCreateTicket(false);
      }
    },
  });

  const handleTicketReposition = useCallback(
    async (
      ticketId: string,
      snapshot: TicketsByColumn,
      current: TicketsByColumn,
    ) => {
      const columnMap = columnIdByStatusRef.current;
      if (!columnMap) return;

      const before = findTicketLocation(snapshot, ticketId);
      const after = findTicketLocation(current, ticketId);

      if (
        before &&
        after &&
        before.status === after.status &&
        before.index === after.index
      ) {
        return;
      }

      const payload = computeRepositionPayload(current, columnMap, ticketId);
      if (!payload || !activeProject) return;

      try {
        const updated = await repositionTicket(
          activeProject.id,
          ticketId,
          payload,
        );
        const boardTicket = mapApiTicketToBoardTicket(updated);

        setTicketsByColumn((prev) => applyBoardTicketUpdate(prev, boardTicket));
      } catch (error) {
        setTicketsByColumn(snapshot);
        toast.error(
          error instanceof Error ? error.message : "Failed to move ticket",
        );
      }
    },
    [activeProject],
  );

  const columns = useMemo<BoardColumnData[]>(() => {
    const filterParams = { query, assignee, priority, type };
    return BOARD_COLUMNS.map((status) => {
      const allInColumn = ticketsByColumn[status] ?? [];
      const items = allInColumn.reduce<BoardColumnData["items"]>(
        (acc, ticket, dndIndex) => {
          if (matchesFilter(ticket, filterParams)) {
            acc.push({ ticket, dndIndex });
          }
          return acc;
        },
        [],
      );

      return {
        status,
        label: STATUS_META[status].label,
        dotClassName: STATUS_META[status].dot,
        items,
      };
    });
  }, [ticketsByColumn, query, assignee, priority, type]);

  const filteredCount = useMemo(
    () => columns.reduce((sum, col) => sum + col.items.length, 0),
    [columns],
  );

  const totalCount = useMemo(
    () =>
      Object.values(ticketsByColumn).reduce(
        (sum, tickets) => sum + tickets.length,
        0,
      ),
    [ticketsByColumn],
  );

  const activeFilterCount =
    (assignee !== "all" ? 1 : 0) +
    (priority !== "all" ? 1 : 0) +
    (type !== "all" ? 1 : 0);

  const clearFilters = () => {
    setAssignee("all");
    setPriority("all");
    setType("all");
    setQuery("");
  };

  const toggleAssigneeFilter = (memberId: string) => {
    setAssignee((current) => (current === memberId ? "all" : memberId));
  };

  const openCreateTicketDialog = useCallback(() => {
    createTicketForm.reset();
    setIsCreateTicketOpen(true);
  }, [createTicketForm]);

  const closeCreateTicketDialog = useCallback(() => {
    setIsCreateTicketOpen(false);
    createTicketForm.reset();
  }, [createTicketForm]);

  return {
    state: {
      query,
      assignee,
      priority,
      type,
      members: MEMBERS,
      filteredCount,
      totalCount,
      activeFilterCount,
      columns,
      ticketsByColumn,
      snapshotRef,
      isCreateTicketOpen,
      isSubmittingCreateTicket,
      createTicketForm,
      activeProject,
      isBoardLoading,
      isBoardError,
    },
    actions: {
      setQuery,
      setAssignee,
      setPriority,
      setType,
      clearFilters,
      toggleAssigneeFilter,
      setTicketsByColumn,
      openCreateTicketDialog,
      closeCreateTicketDialog,
      handleTicketReposition,
    },
  };
};

export default useBoardPage;
