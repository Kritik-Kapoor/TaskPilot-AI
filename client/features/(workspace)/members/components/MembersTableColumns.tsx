"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectMember } from "@/features/(workspace)/types";
import { ColumnDef } from "@tanstack/react-table";
import { Settings } from "lucide-react";
import { formatProjectRole } from "../lib/constants";

const ROLE_CLASS: Record<string, string> = {
  ADMIN: "text-violet-600",
  MEMBER: "text-sky-600",
  VIEWER: "text-muted-foreground",
};

export const createMembersTableColumns = (
  onOpenSettings: (member: ProjectMember) => void,
): ColumnDef<ProjectMember>[] => [
  {
    id: "serial",
    header: "S.No.",
    size: 56,
    maxSize: 56,
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;

      return (
        <span className="text-muted-foreground tabular-nums">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "username",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.username}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-medium capitalize",
          ROLE_CLASS[row.original.role] ?? "text-foreground",
        )}
      >
        {formatProjectRole(row.original.role)}
      </span>
    ),
  },
  {
    id: "settings",
    header: () => <span className="sr-only">Settings</span>,
    size: 48,
    maxSize: 48,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Open settings for ${row.original.username}`}
          onClick={() => onOpenSettings(row.original)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
