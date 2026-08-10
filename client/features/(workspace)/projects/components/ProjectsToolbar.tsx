"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import type { ProjectFilter } from "../hooks/useProjectPage";

const FILTERS: Array<{ value: ProjectFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "mine", label: "My projects" },
  { value: "available", label: "Available" },
];

type ProjectsToolbarProps = {
  query: string;
  filter: ProjectFilter;
  canCreateProject: boolean;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: ProjectFilter) => void;
};

const ProjectsToolbar = ({
  query,
  filter,
  canCreateProject,
  onQueryChange,
  onFilterChange,
}: ProjectsToolbarProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All projects in your organization. Request to join one to start
            collaborating.
          </p>
        </div>

        {canCreateProject && (
          <Button disabled className="shrink-0">
            <Plus className="size-4" />
            New project
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="h-10 w-full max-w-md">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search projects or keys…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </InputGroup>

        <div className="inline-flex rounded-lg border bg-muted/40 p-1">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === item.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectsToolbar;
