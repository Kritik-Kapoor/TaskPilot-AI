"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { formatDisplayName } from "@/features/(workspace)/lib/utils";
import useAuth from "@/lib/hooks/useAuth";
import { useProject } from "@/providers/projectProvider";
import { Bell, CircleHelp, Plus, Search } from "lucide-react";

const getUserInitials = (username: string) =>
  username.slice(0, 2).toUpperCase();

const WorkspaceNavbar = () => {
  const { user } = useAuth();
  const { activeProject } = useProject();

  const organizationName = user?.organizationName
    ? formatDisplayName(user.organizationName)
    : "Organization";

  const projectName = activeProject
    ? formatDisplayName(activeProject.projectName)
    : "Select project";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />

      <nav className="hidden min-w-0 items-center gap-1.5 text-sm text-muted-foreground md:flex">
        <span className="truncate font-medium text-foreground">
          {organizationName}
        </span>
        <span>/</span>
        <span className="truncate">{projectName}</span>
      </nav>

      <div className="mx-auto hidden w-full max-w-xl md:block">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets, projects..."
            className="h-9 bg-muted/40 pl-9 pr-12"
          />
          <kbd className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          size="sm"
          className="hidden bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95 sm:inline-flex"
        >
          <Plus />
          Create
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Help">
          <CircleHelp />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
        </Button>
        <div
          className="grid size-8 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-brand-foreground"
          title={user?.username}
        >
          {user ? getUserInitials(user.username) : "?"}
        </div>
      </div>
    </header>
  );
};

export default WorkspaceNavbar;
