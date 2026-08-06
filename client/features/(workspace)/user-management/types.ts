import type { OrganizationRole } from "@/features/(auth)/types";
import type { ProjectRole } from "@/features/(auth)/types";

export type OrganizationUserProject = {
  projectId: string;
  projectName: string;
  role: ProjectRole;
};

export type OrganizationUser = {
  id: string;
  username: string;
  email: string;
  organizationRole: OrganizationRole | null;
  isOwner: boolean;
  projects: OrganizationUserProject[];
};

export type UpdateOrganizationUserPayload = {
  organizationRole: Exclude<OrganizationRole, "OWNER">;
  projectIds: string[];
};
