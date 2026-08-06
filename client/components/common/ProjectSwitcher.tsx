"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getColor, initialsOf, formatDisplayName } from "@/lib/utils/common";
import { useProject } from "@/providers/projectProvider";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

const ProjectAvatar = ({
  name,
  inDropdown = false,
}: {
  name: string;
  inDropdown?: boolean;
}) => {
  const color = getColor(name);
  const initials = initialsOf(name);

  return (
    <div
      className={`grid shrink-0 place-items-center text-xs font-semibold text-white ${inDropdown ? "size-6 rounded-sm text-[10px]" : "size-8 rounded-lg text-xs"}`}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      {initials}
    </div>
  );
};

const ProjectSwitcher = () => {
  const {
    projects,
    activeProject,
    handleSetActiveProjectId,
    isLoading,
    isProjectAdmin,
  } = useProject();

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-12 w-full rounded-lg" />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!activeProject) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">
              —
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Project
              </span>
              <span className="truncate font-semibold">No projects</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = formatDisplayName(activeProject.projectName);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              tooltip={displayName}
            >
              <ProjectAvatar name={activeProject.projectName} />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Project
                </span>
                <span className="truncate font-semibold">{displayName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl p-1.5 shadow-lg"
            align="start"
            side="bottom"
            sideOffset={6}
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground font-semibold">
              Switch project
            </DropdownMenuLabel>
            {projects.map((project) => {
              const name = formatDisplayName(project.projectName);
              const isActive = project.id === activeProject.id;

              return (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSetActiveProjectId(project.id)}
                  className="gap-2 rounded-lg px-2 py-2.5"
                >
                  <ProjectAvatar name={project.projectName} inDropdown={true} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-tight">
                      {name}
                    </p>
                    <p className="truncate text-sm tracking-wide text-muted-foreground uppercase">
                      {project.projectKey}
                    </p>
                  </div>
                  {isActive && (
                    <Check
                      className="size-4 shrink-0 text-brand"
                      strokeWidth={2.5}
                    />
                  )}
                </DropdownMenuItem>
              );
            })}
            {isProjectAdmin && (
              <>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                  className="gap-2 rounded-lg px-2 py-1"
                  disabled
                >
                  <Plus className="size-4" />
                  New project
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default ProjectSwitcher;
