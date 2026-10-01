"use client";

import { AppSidebar } from "@/components/common/Sidebar";
import ProjectRoleWarningBannerSlot from "@/components/common/ProjectRoleWarningBannerSlot";
import WorkspaceNavbar from "@/components/common/WorkspaceNavbar";
import ProjectMembershipGuard from "@/components/guards/ProjectMembershipGuard";
import DashboardGuard from "@/components/guards/DashboardGuard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AiChatProvider } from "@/features/(workspace)/ai/AiChatProvider";
import { ProjectProvider, useProject } from "@/providers/projectProvider";
import { Suspense } from "react";

function WorkspaceInner({ children }: { children: React.ReactNode }) {
  const { activeProject } = useProject();

  return (
    <AiChatProvider projectId={activeProject?.id ?? null}>
      <TooltipProvider>
        <SidebarProvider className="h-svh overflow-hidden">
          <AppSidebar />
          <SidebarInset className="flex min-h-0 flex-col overflow-hidden">
            <ProjectRoleWarningBannerSlot />
            <WorkspaceNavbar />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
              <ProjectMembershipGuard>{children}</ProjectMembershipGuard>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AiChatProvider>
  );
}

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardGuard>
      <Suspense fallback={null}>
        <ProjectProvider>
          <WorkspaceInner>{children}</WorkspaceInner>
        </ProjectProvider>
      </Suspense>
    </DashboardGuard>
  );
};

export default WorkspaceLayout;
