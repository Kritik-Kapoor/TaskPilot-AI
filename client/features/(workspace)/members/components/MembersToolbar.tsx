"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

type MembersToolbarProps = {
  query: string;
  totalCount: number;
  filteredCount: number;
  setQuery: (query: string) => void;
};

const MembersToolbar = ({
  query,
  totalCount,
  filteredCount,
  setQuery,
}: MembersToolbarProps) => {
  return (
    <div className="shrink-0 space-y-4 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} member${totalCount === 1 ? "" : "s"}`
              : `${filteredCount} of ${totalCount} members`}
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

export default MembersToolbar;
