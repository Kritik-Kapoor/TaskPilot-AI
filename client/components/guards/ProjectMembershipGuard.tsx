"use client";

import { isProjectScopedPath } from "@/features/(workspace)/lib/workspaceRoutes";
import { useProject } from "@/providers/projectProvider";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type ProjectMembershipGuardProps = {
  children: ReactNode;
};

const ProjectMembershipGuard = ({ children }: ProjectMembershipGuardProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { hasJoinedProjects, isLoading } = useProject();

  useEffect(() => {
    if (isLoading || hasJoinedProjects || !isProjectScopedPath(pathname)) {
      return;
    }

    router.replace("/projects");
  }, [hasJoinedProjects, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasJoinedProjects && isProjectScopedPath(pathname)) {
    return null;
  }

  return children;
};

export default ProjectMembershipGuard;
