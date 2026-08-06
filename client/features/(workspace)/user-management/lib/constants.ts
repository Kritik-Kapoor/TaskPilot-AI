import type { OrganizationRole } from "@/features/(auth)/types";

export const MANAGEABLE_ORG_ROLES: Exclude<OrganizationRole, "OWNER">[] = [
  "ADMIN",
  "MEMBER",
];

export const formatOrganizationRole = (role: string | null | undefined) => {
  if (!role) return "—";
  return role.charAt(0) + role.slice(1).toLowerCase();
};
