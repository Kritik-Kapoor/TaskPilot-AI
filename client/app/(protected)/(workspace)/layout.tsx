"use client";

import { AppSidebar } from "@/components/common/Sidebar";
import ProjectRoleWarningBannerSlot from "@/components/common/ProjectRoleWarningBannerSlot";
import WorkspaceNavbar from "@/components/common/WorkspaceNavbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiChatProvider } from "@/features/(workspace)/ai/AiChatProvider";
import { ProjectProvider, useProject } from "@/providers/projectProvider";
import { WorkspaceUiProvider } from "@/providers/workspaceUiProvider";
import { Suspense } from "react";

function WorkspaceInner({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProject();

  return (
    <AiChatProvider projectId={activeProject?.id ?? null}>
      <WorkspaceUiProvider>
        <TooltipProvider>
          <SidebarProvider className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset className="flex min-h-0 flex-col overflow-hidden">
              <ProjectRoleWarningBannerSlot />
              <WorkspaceNavbar />
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </WorkspaceUiProvider>
    </AiChatProvider>
  );
}

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={null}>
      <ProjectProvider>
        <WorkspaceInner>{children}</WorkspaceInner>
      </ProjectProvider>
    </Suspense>
  );
};

export default WorkspaceLayout;
