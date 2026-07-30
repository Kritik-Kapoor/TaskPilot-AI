"use client";

import { useProject } from "@/providers/projectProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import useCreateTicket from "../../hooks/useCreateTicket";
import type { Ticket } from "../../board/types";
import { getProjectBacklog } from "../lib/api";
import type { ProjectBacklogResponse } from "../types";
import { BacklogTableColumns } from "../components/BacklogTableColumns";

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
  const { activeProject, projectMembers } = useProject();

  const [query, setQuery] = useState("");

  const backlogQueryKey = ["project-backlog", activeProject?.id] as const;

  const {
    data: backlogData,
    isPending: isBacklogLoading,
    isError: isBacklogError,
  } = useQuery({
    queryKey: backlogQueryKey,
    queryFn: () => getProjectBacklog(activeProject!.id),
    enabled: !!activeProject?.id,
  });

  // Resolved column UUID from already-fetched backlog data.
  const backlogColumnId = backlogData?.column?.id ?? "";

  const { form: createTicketForm, isOpen: isCreateTicketOpen, isSubmitting: isSubmittingCreateTicket, open: openCreateTicketDialog, close: closeCreateTicketDialog } = useCreateTicket({
    columnId: backlogColumnId,
    onCreated: (ticket) => {
      queryClient.cancelQueries({ queryKey: backlogQueryKey });
      queryClient.setQueryData<ProjectBacklogResponse>(
        backlogQueryKey,
        (old) => old && optimisticCreate(old, ticket),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: backlogQueryKey });
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

  const totalCount = backlogData?.totalTicketCount ?? 0;
  const filteredCount = tickets.length;

  const columns = useMemo(() => BacklogTableColumns, []);

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
    },
    actions: {
      setQuery,
      openCreateTicketDialog,
      closeCreateTicketDialog,
    },
  };
};

export default useBacklogPage;
