"use client";

import { Filter, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TicketCard from "./TicketCard";
import type { BoardColumn } from "../hooks/useBoardPage";

type BoardColumnsProps = {
  columns: BoardColumn[];
};

const BoardColumns = ({ columns }: BoardColumnsProps) => {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full min-w-max gap-4 py-4 pr-2">
        {columns.map((column) => (
          <div
            key={column.status}
            className="flex h-full w-80 shrink-0 flex-col rounded-xl border border-border bg-muted/40"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${column.dotClassName}`}
                />
                <span className="text-sm font-semibold">{column.label}</span>
                <Badge variant="secondary" className="h-5 text-[10px]">
                  {column.tickets.length}
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
              {column.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}

              {column.tickets.length === 0 && (
                <div className="grid h-24 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5" /> No tickets
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardColumns;
