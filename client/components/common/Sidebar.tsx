"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useRef } from "react";
import type { AiAction } from "@/features/(workspace)/ai/types";
import { useWorkspaceUi } from "@/providers/workspaceUiProvider";
import ProjectSwitcher from "@/components/common/ProjectSwitcher";
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
  Inbox,
  List,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquareKanban,
  Users,
} from "lucide-react";
import { CONFIGURATION_SECTIONS } from "@/features/(workspace)/configuration/lib/constants";
import { ProjectConfigurationDialog } from "@/features/(workspace)/configuration/components";
const WORKSPACE_NAV = [
  { title: "Board", href: "/board", icon: SquareKanban },
  { title: "Backlog", href: "/backlog", icon: List },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Assistant", href: "/assistant", icon: Sparkles },
  { title: "Members", href: "/members", icon: Users },
] as const;

const PROJECT_ADMIN_NAV = [
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

const WORKSPACE_PAGE_PATH = {
  board: "/board",
  backlog: "/backlog",
  inbox: "/inbox",
  assistant: "/assistant",
  members: "/members",
  settings: "/settings",
} as const;

const isBoardNavAction = (action: AiAction) =>
  action.type === "navigate_board" ||
  action.type === "create_ticket" ||
  action.type === "assign_tickets" ||
  action.type === "apply_labels" ||
  action.type === "remove_labels" ||
  action.type === "move_tickets";

// Consume these actions on the board page only.
const isBoardPageConsumesAction = (action: AiAction) =>
  action.type === "navigate_board";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isProjectAdmin, buildWorkspacePath, projectRole } = useProject();
  const { pendingAction, consumeAction } = useAiChat();
  const {
    isConfigOpen,
    configSection,
    openConfiguration,
    closeConfiguration,
    setConfigSection,
  } = useWorkspaceUi();
  const boardNavInitiatedRef = useRef<AiAction | null>(null);

  const canManageLabels = projectRole !== "VIEWER";

  const activeSection = useMemo(
    () => CONFIGURATION_SECTIONS.find((s) => s.id === configSection)!,
    [configSection],
  );

  useEffect(() => {
    if (!pendingAction) {
      boardNavInitiatedRef.current = null;
      return;
    }

    if (pendingAction.type === "navigate_page") {
      const path = WORKSPACE_PAGE_PATH[pendingAction.page];
      router.push(buildWorkspacePath(path));
      consumeAction();
      return;
    }

    if (pendingAction.type === "open_config") {
      openConfiguration(pendingAction.tab);
      consumeAction();
    } else if (pendingAction.type === "create_issue_type") {
      openConfiguration("types");
      consumeAction();
    } else if (pendingAction.type === "create_label") {
      openConfiguration("labels");
      consumeAction();
    } else if (pendingAction.type === "create_board_column") {
      openConfiguration("statuses");
      consumeAction();
    } else if (pendingAction.type === "delete_board_column") {
      consumeAction();
    } else if (isBoardNavAction(pendingAction)) {
      const boardPath = buildWorkspacePath("/board");

      if (pathname === boardPath) {
        if (!isBoardPageConsumesAction(pendingAction)) consumeAction();
        return;
      }

      if (boardNavInitiatedRef.current === pendingAction) {
        if (isBoardPageConsumesAction(pendingAction)) consumeAction();
        return;
      }

      boardNavInitiatedRef.current = pendingAction;
      router.push(boardPath);

      if (!isBoardPageConsumesAction(pendingAction)) consumeAction();
    }
  }, [
    pendingAction,
    consumeAction,
    pathname,
    router,
    buildWorkspacePath,
    openConfiguration,
  ]);

  return (
    <>
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

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={isConfigOpen}
                    tooltip="Configuration"
                    onClick={() => openConfiguration()}
                  >
                    <SlidersHorizontal />
                    <span>Configuration</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

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
        </SidebarContent>

        <SidebarFooter />
        <SidebarRail />
      </Sidebar>

      <ProjectConfigurationDialog
        open={isConfigOpen}
        onOpenChange={(open) =>
          open ? openConfiguration() : closeConfiguration()
        }
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
