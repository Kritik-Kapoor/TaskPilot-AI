"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

type JoinRequestToolbarProps = {
  query: string;
  totalCount: number;
  filteredCount: number;
  pendingCount: number;
  setQuery: (query: string) => void;
};

const JoinRequestToolbar = ({
  query,
  totalCount,
  filteredCount,
  pendingCount,
  setQuery,
}: JoinRequestToolbarProps) => {
  return (
    <div className="shrink-0 space-y-4 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Join requests
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} request${totalCount === 1 ? "" : "s"}`
              : `${filteredCount} of ${totalCount} requests`}
            {pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
          </p>
        </div>

        <InputGroup className="h-9 w-56">
          <InputGroupAddon>
            <Search className="h-4 w-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>
    </div>
  );
};

export default JoinRequestToolbar;
