"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  ArrowUpCircle,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import type useBacklogPage from "../hooks/useBacklogPage";

type BacklogToolbarProps = {
  state: ReturnType<typeof useBacklogPage>["state"];
  actions: ReturnType<typeof useBacklogPage>["actions"];
};

const BacklogToolbar = ({ state, actions }: BacklogToolbarProps) => {
  const {
    filteredCount,
    totalCount,
    query,
    selectedCount,
    canEdit,
    isBulkActionPending,
    canBumpToTodo,
  } = state;

  return (
    <div className="shrink-0 space-y-4 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Backlog</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} ticket${totalCount === 1 ? "" : "s"}`
              : `${filteredCount} of ${totalCount} tickets`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBulkActionPending}
                  className="h-9 gap-2"
                >
                  {isBulkActionPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedCount} selected
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  disabled={!canBumpToTodo || isBulkActionPending}
                  onClick={actions.bumpSelectedToTodo}
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Bump to Todo
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isBulkActionPending}
                  onClick={actions.openDeleteSelectedDialog}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete all
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <InputGroup className="h-9 w-56">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search…"
              value={query}
              onChange={(event) => actions.setQuery(event.target.value)}
            />
          </InputGroup>

          {canEdit && (
            <Button
              className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
              onClick={() => actions.openCreateTicketDialog()}
            >
              <Plus className="h-4 w-4" /> New ticket
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacklogToolbar;
