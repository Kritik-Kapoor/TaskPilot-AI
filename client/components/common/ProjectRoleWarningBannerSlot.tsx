"use client";

import { ProjectRoleWarningBanner } from "@/components/common/ProjectProviderFeedback";
import { useProject } from "@/providers/projectProvider";

const ProjectRoleWarningBannerSlot = () => {
  const { showRoleWarning, retryProjectRole, isProjectRoleRetrying } =
    useProject();

  if (!showRoleWarning) return null;

  return (
    <ProjectRoleWarningBanner
      onRetry={() => void retryProjectRole()}
      isRetrying={isProjectRoleRetrying}
    />
  );
};

export default ProjectRoleWarningBannerSlot;
