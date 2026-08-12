"use client";

import CreateProjectDialog from "@/features/(workspace)/projects/components/CreateProjectDialog";
import useCreateProjectDialog from "@/features/(workspace)/projects/hooks/useCreateProjectDialog";
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
import useAuth from "@/lib/hooks/useAuth";
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
  const { user } = useAuth();
  const {
    joinedProjects,
    activeProject,
    handleSetActiveProjectId,
    isLoading,
    hasJoinedProjects,
  } = useProject();
  const { isOpen, open, close, form, isSubmitting } = useCreateProjectDialog();

  const canCreateProject =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-12 w-full rounded-lg" />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!hasJoinedProjects || !activeProject) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            {canCreateProject ? (
              <SidebarMenuButton size="lg" onClick={open}>
                <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Plus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    Project
                  </span>
                  <span className="truncate font-semibold">Create project</span>
                </div>
              </SidebarMenuButton>
            ) : (
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
            )}
          </SidebarMenuItem>
        </SidebarMenu>
        <CreateProjectDialog
          isOpen={isOpen}
          close={close}
          form={form}
          isSubmitting={isSubmitting}
        />
      </>
    );
  }

  const displayName = formatDisplayName(activeProject.projectName);

  return (
    <>
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
              {joinedProjects.map((project) => {
                const name = formatDisplayName(project.projectName);
                const isActive = project.id === activeProject.id;

                return (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => handleSetActiveProjectId(project.id)}
                    className="gap-2 rounded-lg px-2 py-1.5"
                  >
                    <ProjectAvatar
                      name={project.projectName}
                      inDropdown={true}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium leading-tight">
                        {name}
                      </p>
                      <p className="truncate text-xs tracking-wide text-muted-foreground uppercase">
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
              {canCreateProject && (
                <>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem
                    className="gap-2 rounded-lg px-2 py-1"
                    onSelect={(event) => {
                      event.preventDefault();
                      open();
                    }}
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
      <CreateProjectDialog
        isOpen={isOpen}
        close={close}
        form={form}
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default ProjectSwitcher;
