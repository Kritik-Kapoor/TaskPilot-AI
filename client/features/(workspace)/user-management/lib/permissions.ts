import type { OrganizationUser } from "../types";

export const canEditOrganizationUser = (
  isActorOwner: boolean,
  target: OrganizationUser,
) => {
  if (target.isOwner) return false;
  if (isActorOwner) return true;

  return target.organizationRole === "MEMBER";
};

export const canChangeOrganizationUserRole = (
  isActorOwner: boolean,
  target: OrganizationUser,
) => {
  if (!isActorOwner || target.isOwner) return false;

  return true;
};
