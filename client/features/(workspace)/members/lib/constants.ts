import type { ProjectRole } from "@/features/(auth)/types";

export const PROJECT_MEMBER_ROLES: ProjectRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export const formatProjectRole = (role: string) =>
  role.charAt(0) + role.slice(1).toLowerCase();
