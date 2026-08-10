"use client";

import Dropdown from "@/components/common/Dropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { formatDisplayName, initialsOf } from "@/lib/utils/common";
import useAuth from "@/lib/hooks/useAuth";
import { useProject } from "@/providers/projectProvider";
import {
  Bell,
  CircleHelp,
  LogOut,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const WorkspaceNavbar = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeProject } = useProject();

  const organizationName = user?.organizationName
    ? formatDisplayName(user.organizationName)
    : "Organization";

  const projectName = activeProject
    ? formatDisplayName(activeProject.projectName)
    : "Select project";

  const userMenuGroups = useMemo(
    () => [
      {
        actions: [
          {
            label: "Profile",
            icon: <UserRound className="size-4" />,
            onClick: () => router.push("/profile"),
          },
        ],
      },
      {
        actions: [
          {
            label: "Sign out",
            icon: <LogOut className="size-4" />,
            onClick: () => logout(),
          },
        ],
      },
    ],
    [logout, router],
  );

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

      <div className="ml-auto flex items-center gap-2">
        <Button className="hidden bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95 sm:inline-flex">
          <Plus />
          Create
        </Button>
        <Button variant="ghost" size="icon-lg" aria-label="Help">
          <CircleHelp />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Notifications"
          className="relative"
        >
          <Bell />
          <span className="absolute top-1.25 right-1.5 size-2 rounded-full bg-destructive" />
        </Button>
        <Dropdown
          align="end"
          openOnHover
          header={
            user
              ? {
                  title: user.username,
                  subtitle: user.email,
                }
              : undefined
          }
          groups={userMenuGroups}
          trigger={
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full bg-gradient-brand text-xs font-semibold text-brand-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open account menu"
            >
              {user ? initialsOf(user.username) : "?"}
            </button>
          }
        />
      </div>
    </header>
  );
};

export default WorkspaceNavbar;
