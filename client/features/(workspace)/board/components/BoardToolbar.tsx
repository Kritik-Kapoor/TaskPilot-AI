"use client";

import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  initialsOf,
  type TicketPriority,
  type TicketType,
} from "@/features/(onboarding)/lib/mock-app";
import { cn } from "@/lib/utils";
import { BOARD_PRIORITIES, BOARD_TYPES } from "../constants";
import type useBoardPage from "../hooks/useBoardPage";

type BoardToolbarProps = {
  state: ReturnType<typeof useBoardPage>["state"];
  actions: ReturnType<typeof useBoardPage>["actions"];
};

const BoardToolbar = ({ state, actions }: BoardToolbarProps) => {
  const {
    query,
    assignee,
    priority,
    type,
    members,
    filteredCount,
    totalCount,
    activeFilterCount,
  } = state;

  const {
    setQuery,
    setAssignee,
    setPriority,
    setType,
    clearFilters,
    toggleAssigneeFilter,
  } = actions;

  return (
    <div className="shrink-0 space-y-3 border-b border-border bg-background pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Board</h1>
          <p className="text-xs text-muted-foreground">
            Sprint 24 · {filteredCount} of {totalCount} tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4" /> Group by
          </Button>
          <Button
            size="sm"
            className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
            onClick={actions.openCreateTicketDialog}
          >
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets…"
            className="h-9 w-64 pl-8"
          />
        </div>

        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priority}
          onValueChange={(value) => setPriority(value as TicketPriority | "all")}
        >
          <SelectTrigger className="h-9 w-35">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any priority</SelectItem>
            {BOARD_PRIORITIES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={type}
          onValueChange={(value) => setType(value as TicketType | "all")}
        >
          <SelectTrigger className="h-9 w-32.5">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any type</SelectItem>
            {BOARD_TYPES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" /> Clear ({activeFilterCount})
          </Button>
        )}

        <div className="ml-auto flex -space-x-2">
          {members.slice(0, 5).map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => toggleAssigneeFilter(member.id)}
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background transition-transform hover:-translate-y-0.5",
                assignee === member.id && "ring-brand",
              )}
              style={{ background: member.avatarColor }}
              title={member.name}
            >
              {initialsOf(member.name)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoardToolbar;
