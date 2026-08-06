"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDisplayName } from "@/lib/utils/common";
import type { OrganizationRole } from "@/features/(auth)/types";
import { ColumnDef } from "@tanstack/react-table";
import { Settings } from "lucide-react";
import type { OrganizationUser } from "../types";
import { formatOrganizationRole } from "../lib/constants";

const ROLE_CLASS: Record<OrganizationRole, string> = {
  OWNER: "text-amber-600",
  ADMIN: "text-violet-600",
  MEMBER: "text-sky-600",
};

export const createUserManagementTableColumns = (
  onOpenSettings: (user: OrganizationUser) => void,
): ColumnDef<OrganizationUser>[] => [
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
    id: "organizationRole",
    header: "Org role",
    cell: ({ row }) => {
      const role = row.original.isOwner
        ? "OWNER"
        : row.original.organizationRole;

      return (
        <span
          className={cn(
            "font-medium capitalize",
            role ? ROLE_CLASS[role] : "text-foreground",
          )}
        >
          {formatOrganizationRole(role)}
        </span>
      );
    },
  },
  {
    id: "projects",
    header: "Projects",
    cell: ({ row }) => {
      const { projects } = row.original;

      if (projects.length === 0) {
        return <span className="text-muted-foreground">None</span>;
      }

      return (
        <div className="flex flex-wrap gap-1">
          {projects.slice(0, 2).map((project) => (
            <Badge
              key={project.projectId}
              variant="secondary"
              className="text-[10px]"
            >
              {formatDisplayName(project.projectName)}
            </Badge>
          ))}
          {projects.length > 2 && (
            <Badge variant="outline" className="text-[10px]">
              +{projects.length - 2}
            </Badge>
          )}
        </div>
      );
    },
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
