"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/dateFormatting";
import type { JoinRequestStatus } from "@/features/(onboarding)/types";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Loader2, X } from "lucide-react";
import type { IncomingJoinRequest, ReviewJoinRequestAction } from "../types";
import { formatJoinRequestStatus } from "../lib/constants";

const STATUS_CLASS: Record<JoinRequestStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DECLINED: "border-rose-200 bg-rose-50 text-rose-700",
};

type CreateJoinRequestTableColumnsOptions = {
  canManage: boolean;
  reviewing: {
    requestId: string;
    action: ReviewJoinRequestAction;
  } | null;
  onApprove: (request: IncomingJoinRequest) => void;
  onDecline: (request: IncomingJoinRequest) => void;
};

export const createJoinRequestTableColumns = ({
  canManage,
  reviewing,
  onApprove,
  onDecline,
}: CreateJoinRequestTableColumnsOptions): ColumnDef<IncomingJoinRequest>[] => [
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
    id: "username",
    header: "Username",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.user.username}</span>
    ),
  },
  {
    id: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.user.email}</span>
    ),
  },
  {
    accessorKey: "requestedOn",
    header: "Requested on",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDateTime(row.original.requestedOn)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const request = row.original;
      const isReviewing = reviewing?.requestId === request.id;

      if (request.status === "PENDING" && canManage) {
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={Boolean(reviewing)}
              onClick={() => onApprove(request)}
              className="h-8 bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
            >
              {isReviewing && reviewing?.action === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={Boolean(reviewing)}
              onClick={() => onDecline(request)}
              className="h-8 text-destructive hover:text-destructive"
            >
              {isReviewing && reviewing?.action === "decline" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Decline
            </Button>
          </div>
        );
      }

      return (
        <Badge
          variant="outline"
          className={cn(
            "border text-[11px] uppercase",
            STATUS_CLASS[request.status],
          )}
        >
          {formatJoinRequestStatus(request.status)}
        </Badge>
      );
    },
    enableSorting: false,
  },
];
