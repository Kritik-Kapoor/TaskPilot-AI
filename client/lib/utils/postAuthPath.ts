import type { User } from "@/features/(auth)/types";
import { slugify } from "@/features/(onboarding)/lib/orgUtils";

export const needsOrganization = (user: User) => !user.organizationId;

export const isOrganizationOwner = (user: User) =>
  user.organizationRole === "OWNER";

export const shouldCompleteProjectSetup = (user: User) =>
  isOrganizationOwner(user) &&
  Boolean(user.organizationId) &&
  (user.organizationProjectCount ?? 0) === 0;

export const hasCompletedOnboarding = (user: User) => {
  if (needsOrganization(user)) {
    return false;
  }

  if (shouldCompleteProjectSetup(user)) {
    return false;
  }

  return true;
};

export const getPostAuthPath = (user: User) => {
  if (needsOrganization(user)) {
    return "/onboarding";
  }

  if (shouldCompleteProjectSetup(user) && user.organizationName) {
    return `/onboarding/create-project?org=${slugify(user.organizationName)}`;
  }

  return "/board";
};
