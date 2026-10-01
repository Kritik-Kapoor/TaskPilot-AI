"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import ProjectSwitcher from "@/components/common/ProjectSwitcher";
import useAuth from "@/lib/hooks/useAuth";
import { useProject } from "@/providers/projectProvider";
import { useAiChat } from "@/features/(workspace)/ai/AiChatProvider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Building2,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  List,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquareKanban,
  User,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { CONFIGURATION_SECTIONS } from "@/features/(workspace)/configuration/lib/constants";
import { ProjectConfigurationDialog } from "@/features/(workspace)/configuration/components";
import type { ConfigurationSection } from "@/features/(workspace)/configuration/types";

const WORKSPACE_NAV = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Board", href: "/board", icon: SquareKanban },
  { title: "Backlog", href: "/backlog", icon: List },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Assistant", href: "/assistant", icon: Sparkles },
  { title: "Members", href: "/members", icon: Users },
] as const;

const PROJECT_ADMIN_NAV = [
  { title: "Settings", href: "/settings", icon: Settings },
  {
    title: "Project Join Requests",
    href: "/project-join-request",
    icon: UserPlus,
  },
] as const;

const ORG_NAV = [
  { title: "Projects", href: "/projects", icon: FolderKanban },
  { title: "Organization", href: "/organization", icon: Building2 },
  { title: "Profile", href: "/profile", icon: User },
] as const;

const ORG_ADMIN_NAV = [
  { title: "Join Requests", href: "/join-request", icon: UserPlus },
  { title: "User Management", href: "/user-management", icon: UserCog },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { isProjectAdmin, hasJoinedProjects, buildWorkspacePath, projectRole } =
    useProject();
  const { pendingAction, consumeAction } = useAiChat();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configSection, setConfigSection] =
    useState<ConfigurationSection>("labels");

  const isOrgAdmin =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";

  const canManageLabels = projectRole !== "VIEWER";

  const activeSection = useMemo(
    () => CONFIGURATION_SECTIONS.find((s) => s.id === configSection)!,
    [configSection],
  );

  useEffect(() => {
    if (!pendingAction) return;

    if (pendingAction.type === "open_config") {
      setConfigSection(pendingAction.tab);
      setIsConfigOpen(true);
      consumeAction();
    } else if (pendingAction.type === "create_issue_type") {
      setConfigSection("types");
      setIsConfigOpen(true);
      consumeAction();
    } else if (
      pendingAction.type === "navigate_board" ||
      pendingAction.type === "create_ticket"
    ) {
      const boardPath = buildWorkspacePath("/board");
      if (pathname !== boardPath) {
        router.push(boardPath);
      }
    }
  }, [pendingAction, consumeAction, pathname, router, buildWorkspacePath]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <ProjectSwitcher />
        </SidebarHeader>

        <SidebarContent>
          {hasJoinedProjects ? (
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {WORKSPACE_NAV.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={buildWorkspacePath(item.href)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isConfigOpen}
                      tooltip="Configuration"
                      onClick={() => setIsConfigOpen(true)}
                    >
                      <SlidersHorizontal />
                      <span>Configuration</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel>Organization</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ORG_NAV.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isProjectAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Project Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {PROJECT_ADMIN_NAV.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={buildWorkspacePath(item.href)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {isOrgAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Organization Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {ORG_ADMIN_NAV.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter />
        <SidebarRail />
      </Sidebar>

      <ProjectConfigurationDialog
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        section={configSection}
        onSectionChange={setConfigSection}
        activeSectionTitle={activeSection.title}
        activeSectionDescription={activeSection.description}
        canManageLabels={canManageLabels}
        isProjectAdmin={isProjectAdmin}
      />
    </>
  );
}
