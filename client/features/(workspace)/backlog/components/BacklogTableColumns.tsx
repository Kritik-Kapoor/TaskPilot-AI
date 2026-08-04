"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { getColor, initialsOf } from "@/lib/utils/common";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PRIORITY_CLASS, TYPE_CLASS } from "../../board/lib/constants";
import type { Ticket } from "../../board/types";
import { formatTicketEnum } from "../lib/constants";

export const createBacklogTableColumns = (
  getTicketHref: (ticketId: string) => string,
  options?: { enableSelection?: boolean },
): ColumnDef<Ticket>[] => {
  const selectionColumn: ColumnDef<Ticket> = {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all tickets on this page"
        onClick={(event) => event.stopPropagation()}
      />
    ),
    size: 40,
    maxSize: 40,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.ticketKey}`}
        onClick={(event) => event.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  const dataColumns: ColumnDef<Ticket>[] = [
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

  return options?.enableSelection
    ? [selectionColumn, ...dataColumns]
    : dataColumns;
};
