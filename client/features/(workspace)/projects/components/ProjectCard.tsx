"use client";

import AvatarStack from "@/components/common/AvatarStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { JoinRequestStatus } from "@/features/(onboarding)/types";
import type { Project } from "@/features/(workspace)/types";
import { formatDisplayName, getColor, initialsOf } from "@/lib/utils/common";
import { ArrowRight, Check, Loader2, Ticket, Users } from "lucide-react";

type ProjectCardProps = {
  project: Project;
  effectiveStatus: JoinRequestStatus | null;
  isRequestingJoin: boolean;
  onRequestJoin: () => void;
  onOpen: () => void;
};

const ProjectCard = ({
  project,
  effectiveStatus,
  isRequestingJoin,
  onRequestJoin,
  onOpen,
}: ProjectCardProps) => {
  const color = getColor(project.projectName);
  const isMember = project.isJoined || effectiveStatus === "APPROVED";

  const renderFooterAction = () => {
    if (isMember) {
      return (
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Open
          <ArrowRight className="size-4" />
        </Button>
      );
    }

    if (effectiveStatus === "PENDING") {
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700"
        >
          Request sent
        </Badge>
      );
    }

    if (effectiveStatus === "DECLINED") {
      return (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isRequestingJoin}
          onClick={onRequestJoin}
        >
          {isRequestingJoin ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : null}
          Request again
        </Button>
      );
    }

    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isRequestingJoin}
        onClick={onRequestJoin}
        className="w-full"
      >
        {isRequestingJoin ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : null}
        Request to join
      </Button>
    );
  };

  return (
    <article className="flex flex-col rounded-xl border transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            }}
          >
            {initialsOf(project.projectName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-semibold">
                {formatDisplayName(project.projectName)}
              </h2>
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase"
              >
                {project.projectKey}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {project.description?.trim() || "No description provided"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            {project.memberCount}{" "}
            {project.memberCount === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ticket className="size-3.5" />
            {project.ticketCount ?? 0}{" "}
            {(project.ticketCount ?? 0) === 1 ? "ticket" : "tickets"}
          </span>
        </div>
      </div>
      <div className="border-t px-5 py-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <AvatarStack
            data={(project.memberPreview ?? [])
              .slice(0, 4)
              .map((member) => initialsOf(member.username))}
            totalUsers={project.memberCount}
          />
          <div className="flex min-w-0 justify-end">{renderFooterAction()}</div>
        </div>
        {isMember ? (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <Check className="size-4" />
            <span>You&apos;re a member</span>
          </Badge>
        ) : effectiveStatus === "DECLINED" ? (
          <Badge
            variant="outline"
            className="border-rose-200 bg-rose-50 text-rose-700"
          >
            Declined
          </Badge>
        ) : null}
      </div>
    </article>
  );
};

export default ProjectCard;
