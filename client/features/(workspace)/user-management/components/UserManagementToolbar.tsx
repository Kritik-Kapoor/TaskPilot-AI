"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Search } from "lucide-react";

type UserManagementToolbarProps = {
  query: string;
  totalCount: number;
  filteredCount: number;
  setQuery: (query: string) => void;
};

const UserManagementToolbar = ({
  query,
  totalCount,
  filteredCount,
  setQuery,
}: UserManagementToolbarProps) => {
  return (
    <div className="shrink-0 space-y-4 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            User management
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredCount === totalCount
              ? `${totalCount} user${totalCount === 1 ? "" : "s"}`
              : `${filteredCount} of ${totalCount} users`}
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

export default UserManagementToolbar;
