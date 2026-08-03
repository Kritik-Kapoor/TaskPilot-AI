"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getColor, initialsOf } from "@/lib/utils/common";
import { ColumnDef } from "@tanstack/react-table";
import { Circle } from "lucide-react";
import Link from "next/link";
import { PRIORITY_CLASS, TYPE_CLASS } from "../../board/lib/constants";
import type { Ticket } from "../../board/types";
import { formatTicketEnum } from "../lib/constants";

export const createBacklogTableColumns = (
  getTicketHref: (ticketId: string) => string,
): ColumnDef<Ticket>[] => [
  {
    id: "select",
    header: () => null,
    size: 30,
    maxSize: 30,
    cell: ({ row }) => (
      <button
        type="button"
        className="text-muted-foreground/50 hover:text-muted-foreground"
        aria-label={`Select ${row.original.ticketKey}`}
      >
        <Circle className="h-4 w-4" strokeWidth={1.5} />
      </button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "ticketKey",
    header: "Key",
    size: 80,
    maxSize: 80,
    cell: ({ row }) => (
      <Link
        href={getTicketHref(row.original.id)}
        className="font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        {row.original.ticketKey}
      </Link>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 350,
    maxSize: 350,
    cell: ({ row }) => (
      <Link
        href={getTicketHref(row.original.id)}
        className="font-medium hover:text-brand"
      >
        {row.original.title.length > 65
          ? row.original.title.slice(0, 65) + "..."
          : row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    size: 100,
    maxSize: 100,
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "border text-[10px] uppercase",
          TYPE_CLASS[row.original.type],
        )}
      >
        {formatTicketEnum(row.original.type)}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
    size: 100,
    maxSize: 100,
    cell: ({ row }) => (
      <span
        className={cn("font-medium", PRIORITY_CLASS[row.original.priority])}
      >
        {formatTicketEnum(row.original.priority)}
      </span>
    ),
  },
  {
    accessorKey: "storyPoints",
    header: "Pts",
    size: 50,
    maxSize: 50,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.storyPoints ?? "—"}
      </span>
    ),
  },
  {
    id: "assignee",
    header: "Assignee",
    size: 100,
    maxSize: 100,
    cell: ({ row }) => {
      const assignee = row.original.assignee;

      if (!assignee) {
        return <span className="text-muted-foreground">NA</span>;
      }

      return (
        <span className="inline-flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
            style={{ background: getColor(assignee.username) }}
          >
            {initialsOf(assignee.username)}
          </span>
          <span className="text-muted-foreground">{assignee.username}</span>
        </span>
      );
    },
  },
];
