"use client";

import { Filter, Plus } from "lucide-react";
import { CollisionPriority } from "@dnd-kit/abstract";
import { DragDropProvider, useDroppable } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { TicketsByColumn, BoardColumnData } from "../hooks/useBoardPage";
import TicketCard from "./TicketCard";

type BoardColumnsProps = {
  columns: BoardColumnData[];
  ticketsByColumn: TicketsByColumn;
  snapshotRef: MutableRefObject<TicketsByColumn>;
  setTicketsByColumn: Dispatch<SetStateAction<TicketsByColumn>>;
  onTicketReposition: (
    ticketId: string,
    snapshot: TicketsByColumn,
    current: TicketsByColumn,
  ) => void | Promise<void>;
};

type DroppableColumnProps = { column: BoardColumnData };

function DroppableColumn({ column }: DroppableColumnProps) {
  const { ref, isDropTarget } = useDroppable({
    id: column.status,
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
          <span className={`h-2 w-2 rounded-full ${column.dotClassName}`} />
          <span className="text-sm font-semibold">{column.label}</span>
          <Badge variant="secondary" className="h-5 text-[10px]">
            {column.items.length}
          </Badge>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label={`Add ticket to ${column.label}`}
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
            column={column.status}
          />
        ))}

        {column.items.length === 0 && (
          <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> No tickets
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BoardColumns = ({
  columns,
  ticketsByColumn,
  snapshotRef,
  setTicketsByColumn,
  onTicketReposition,
}: BoardColumnsProps) => {
  return (
    <DragDropProvider
      onDragStart={() => {
        snapshotRef.current = ticketsByColumn;
      }}
      onDragOver={(event) => {
        setTicketsByColumn((prev) => move(prev, event));
      }}
      onDragEnd={(event) => {
        if (event.canceled) {
          setTicketsByColumn(snapshotRef.current);
          return;
        }

        const ticketId = String(event.operation.source?.id ?? "");
        if (!ticketId) return;

        setTicketsByColumn((current) => {
          void onTicketReposition(ticketId, snapshotRef.current, current);
          return current;
        });
      }}
    >
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full min-w-max gap-4 py-4 pr-2">
          {columns.map((column) => (
            <DroppableColumn key={column.status} column={column} />
          ))}
        </div>
      </div>
    </DragDropProvider>
  );
};

export default BoardColumns;
