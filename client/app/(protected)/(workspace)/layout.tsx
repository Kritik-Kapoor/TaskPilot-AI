"use client";

import { AppSidebar } from "@/components/common/Sidebar";
import WorkspaceNavbar from "@/components/common/WorkspaceNavbar";
import DashboardGuard from "@/components/guards/DashboardGuard";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectProvider } from "@/providers/projectProvider";
import { Suspense } from "react";

const WorkspaceLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <DashboardGuard>
      <Suspense fallback={null}>
        <ProjectProvider>
          <TooltipProvider>
            <SidebarProvider className="h-svh overflow-hidden">
              <AppSidebar />
              <SidebarInset className="min-h-0 overflow-hidden">
                <WorkspaceNavbar />
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
                  {children}
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ProjectProvider>
      </Suspense>
    </DashboardGuard>
  );
};

export default WorkspaceLayout;
