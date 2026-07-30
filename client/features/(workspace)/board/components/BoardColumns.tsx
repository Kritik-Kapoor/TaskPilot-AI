"use client";

import { Plus } from "lucide-react";
import { CollisionPriority } from "@dnd-kit/abstract";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import type { DragEndEvent, DragOverEvent } from "@dnd-kit/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BoardColumnData } from "../hooks/useBoardPage";
import TicketCard from "./TicketCard";

type DndHandlers = {
  onDragStart: () => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
};

type BoardColumnsProps = {
  columns: BoardColumnData[];
  dndHandlers: DndHandlers;
  isLoading?: boolean;
};

function DroppableColumn({ column }: { column: BoardColumnData }) {
  const { ref, isDropTarget } = useDroppable({
    id: column.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-80 shrink-0 flex-col rounded-xl border border-border bg-muted/40 transition-colors duration-150",
        isDropTarget && "border-brand/40 bg-brand/5",
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: column.color ?? "#6b7280" }}
          />
          <span className="text-sm font-semibold">{column.name}</span>
          <Badge variant="secondary" className="h-5 text-[10px]">
            {column.items.length}
          </Badge>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Add ticket to ${column.name}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {column.items.map(({ ticket, dndIndex }) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            index={dndIndex}
            columnId={column.id}
          />
        ))}

        {column.items.length === 0 && (
          <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            No tickets
          </div>
        )}
      </div>
    </div>
  );
}

const BoardColumns = ({
  columns,
  dndHandlers,
  isLoading,
}: BoardColumnsProps) => {
  if (isLoading) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading board…
      </div>
    );
  }

  if (!columns.length) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        No columns configured for this project.
      </div>
    );
  }

  return (
    <DragDropProvider
      onDragStart={dndHandlers.onDragStart}
      onDragOver={dndHandlers.onDragOver}
      onDragEnd={dndHandlers.onDragEnd}
    >
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max gap-4 py-4 pr-2">
          {columns.map((column) => (
            <DroppableColumn key={column.id} column={column} />
          ))}
        </div>
      </div>
    </DragDropProvider>
  );
};

export default BoardColumns;
