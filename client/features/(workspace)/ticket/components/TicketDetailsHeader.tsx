"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDisplayName } from "@/lib/utils/common";
import { formatTicketEnum } from "@/features/(workspace)/backlog/lib/constants";
import { TYPE_CLASS } from "@/features/(workspace)/board/lib/constants";
import type {
  TicketDetail,
  TicketType,
} from "@/features/(workspace)/board/types";
import type { Project, ProjectMember } from "@/features/(workspace)/types";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Link2,
  Loader2,
  MessageSquare,
  SquarePen,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type TicketDetailsHeaderProps = {
  ticket: TicketDetail;
  project: Project | null;
  members: ProjectMember[];
  commentCount: number;
  title: string;
  canEdit: boolean;
  isSaving: boolean;
  isDescriptionDirty: boolean;
  buildWorkspacePath: (path: string) => string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onDelete: () => void;
};

const formatTicketDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const TicketDetailsHeader = ({
  ticket,
  project,
  members,
  commentCount,
  title,
  canEdit,
  isSaving,
  isDescriptionDirty,
  buildWorkspacePath,
  onTitleChange,
  onSave,
  onDelete,
}: TicketDetailsHeaderProps) => {
  const projectName = project
    ? formatDisplayName(project.projectName)
    : "Project";

  const creatorName =
    ticket.createdBy?.username ??
    members.find((member) => member.id === ticket.createdById)?.username ??
    "Unknown";

  const copyTicketLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ticket link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const hasUnsavedChanges = isDescriptionDirty;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitTitle = () => {
    const trimmed = draftTitle.trim();

    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setDraftTitle(title);
    }

    setIsEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setDraftTitle(title);
    setIsEditingTitle(false);
  };

  return (
    <header className="space-y-2 border-b border-border/80 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Ticket breadcrumb"
          className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-muted-foreground mb-4"
        >
          <Link
            href={buildWorkspacePath("/board")}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> Board
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-brand"
              aria-hidden
            />
            <span className="truncate">{projectName}</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
          <span className="truncate font-mono text-foreground/70">
            {ticket.ticketKey}
          </span>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            aria-label="Copy ticket link"
            onClick={() => void copyTicketLink()}
          >
            <Link2 className="h-4 w-4" />
          </Button>

          {canEdit && (
            <Button
              type="button"
              variant="outline"
              aria-label="Delete ticket"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {canEdit && hasUnsavedChanges && (
            <Button
              type="button"
              disabled={isSaving}
              onClick={onSave}
              className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            "border text-[11px] uppercase",
            TYPE_CLASS[ticket.type as TicketType],
          )}
        >
          {formatTicketEnum(ticket.type)}
        </Badge>
        <span className="font-mono text-sm text-muted-foreground">
          {ticket.ticketKey}
        </span>
      </div>

      <div className="flex min-w-0 items-start gap-2">
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTitle();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                cancelTitleEdit();
              }
            }}
            maxLength={140}
            className="h-auto flex-1 border-none bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:ring-0 md:text-3xl"
            placeholder="Ticket title"
            aria-label="Edit ticket title"
          />
        ) : (
          <>
            <h1 className="min-w-0 text-xl leading-tight font-semibold md:text-2xl">
              {title}
            </h1>
            {canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Edit title"
                className="mt-1 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setDraftTitle(title);
                  setIsEditingTitle(true);
                }}
              >
                <SquarePen className="size-4 text-blue-500" />
              </Button>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Created by
          <span className="font-medium text-foreground">{creatorName}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          Created {formatTicketDate(ticket.createdAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Updated {formatTicketDate(ticket.updatedAt)}
        </span>
      </div>
    </header>
  );
};

export default TicketDetailsHeader;
