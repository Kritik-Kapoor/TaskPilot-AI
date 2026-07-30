"use client";

import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type useBacklogPage from "../hooks/useBacklogPage";

type BacklogToolbarProps = {
  state: ReturnType<typeof useBacklogPage>["state"];
  actions: ReturnType<typeof useBacklogPage>["actions"];
};

const BacklogToolbar = ({ state, actions }: BacklogToolbarProps) => {
  const { filteredCount, totalCount, query } = state;

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

          <Button
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
            onClick={actions.openCreateTicketDialog}
          >
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BacklogToolbar;
