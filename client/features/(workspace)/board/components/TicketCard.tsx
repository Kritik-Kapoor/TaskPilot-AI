"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { initialsOf, getColor } from "@/lib/utils/common";
import { useProject } from "@/providers/projectProvider";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { PRIORITY_CLASS, TYPE_CLASS } from "../lib/constants";
import type { Ticket } from "../types";

type TicketCardProps = {
  ticket: Ticket;
  index: number;
  columnId: string;
};

const TicketCard = ({ ticket, index, columnId }: TicketCardProps) => {
  const router = useRouter();
  const { projectMembers, buildWorkspacePath } = useProject();
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const { ref, isDragging } = useSortable({
    id: ticket.id,
    index,
    type: "item",
    accept: "item",
    group: columnId,
  });

  const assignee = projectMembers?.find(
    (member) => member.id === ticket.assigneeId,
  );

  const ticketHref = buildWorkspacePath(`/ticket/${ticket.id}`);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !pointerStart.current) return;

    const deltaX = Math.abs(event.clientX - pointerStart.current.x);
    const deltaY = Math.abs(event.clientY - pointerStart.current.y);

    if (deltaX > 6 || deltaY > 6) return;

    router.push(ticketHref);
  };

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-card transition-all",
        "hover:border-brand/40 hover:shadow-elegant",
        isDragging && "cursor-grabbing opacity-40 shadow-none",
      )}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={cn(
            "border text-[10px] uppercase",
            TYPE_CLASS[ticket.type],
          )}
        >
          {ticket.type}
        </Badge>
        <span
          className={cn(
            "text-[10px] font-medium tracking-wider uppercase",
            PRIORITY_CLASS[ticket.priority],
          )}
        >
          {ticket.priority}
        </span>
      </div>

      <h4 className="mt-2 text-sm leading-snug font-medium">{ticket.title}</h4>

      {ticket.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {ticket.labels.map((label) => (
            <span
              key={label.id}
              className="rounded px-1.5 py-0.5 text-[10px] text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">
          {ticket.ticketKey}
        </span>
        <div className="flex items-center gap-2">
          {ticket.storyPoints != null && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[10px] font-semibold">
              {ticket.storyPoints}
            </span>
          )}
          {assignee ? (
            <div
              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: getColor(assignee.username) }}
              title={assignee.username}
            >
              {initialsOf(assignee.username)}
            </div>
          ) : (
            <div
              className="h-6 w-6 rounded-full border border-dashed border-border"
              title="Unassigned"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
