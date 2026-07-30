"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectSwitcher from "@/components/common/ProjectSwitcher";
import { useProject } from "@/providers/projectProvider";
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
  Inbox,
  LayoutDashboard,
  List,
  Settings,
  SquareKanban,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

const WORKSPACE_NAV = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Board", href: "/board", icon: SquareKanban },
  { title: "Backlog", href: "/backlog", icon: List },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Members", href: "/members", icon: Users },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

const ADMIN_NAV = [
  { title: "Join Request", href: "/join-request", icon: UserPlus },
  { title: "User Management", href: "/user-management", icon: UserCog },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { isProjectAdmin, buildWorkspacePath } = useProject();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <ProjectSwitcher />
      </SidebarHeader>

      <SidebarContent>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isProjectAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_NAV.map((item) => (
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
      </SidebarContent>

      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
