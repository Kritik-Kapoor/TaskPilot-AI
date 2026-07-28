"use client";

import { useMemo, useState } from "react";
import {
  MEMBERS,
  TICKETS,
  STATUS_META,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/features/(onboarding)/lib/mock-app";
import { BOARD_COLUMNS } from "../constants";

const filterTickets = (
  tickets: Ticket[],
  {
    query,
    assignee,
    priority,
    type,
  }: {
    query: string;
    assignee: string;
    priority: TicketPriority | "all";
    type: TicketType | "all";
  },
) =>
  tickets.filter((ticket) => {
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
      if (assignee !== "unassigned" && ticket.assigneeId !== assignee) {
        return false;
      }
    }

    if (priority !== "all" && ticket.priority !== priority) return false;
    if (type !== "all" && ticket.type !== type) return false;

    return true;
  });

const useBoardPage = () => {
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState<string>("all");
  const [priority, setPriority] = useState<TicketPriority | "all">("all");
  const [type, setType] = useState<TicketType | "all">("all");

  const filteredTickets = useMemo(
    () =>
      filterTickets(TICKETS, {
        query,
        assignee,
        priority,
        type,
      }),
    [query, assignee, priority, type],
  );

  const columns = useMemo(
    () =>
      BOARD_COLUMNS.map((status) => ({
        status,
        label: STATUS_META[status].label,
        dotClassName: STATUS_META[status].dot,
        tickets: filteredTickets.filter((ticket) => ticket.status === status),
      })),
    [filteredTickets],
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

  return {
    state: {
      query,
      assignee,
      priority,
      type,
      members: MEMBERS,
      filteredCount: filteredTickets.length,
      totalCount: TICKETS.length,
      activeFilterCount,
      columns,
    },
    actions: {
      setQuery,
      setAssignee,
      setPriority,
      setType,
      clearFilters,
      toggleAssigneeFilter,
    },
  };
};

export default useBoardPage;

export type BoardColumn = {
  status: TicketStatus;
  label: string;
  dotClassName: string;
  tickets: Ticket[];
};
