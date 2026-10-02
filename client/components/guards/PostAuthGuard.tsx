"use client";

import useAuth from "@/lib/hooks/useAuth";
import {
  getPostAuthPath,
  hasCompletedOnboarding,
  needsOrganization,
  shouldCompleteProjectSetup,
} from "@/lib/utils/postAuthPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const PROJECT_SETUP_ALLOWED_PATHS = [
  "/onboarding/create-project",
  "/onboarding/done",
];

const shouldRedirectCompletedUserFromOnboarding = (pathname: string) =>
  pathname === "/onboarding" ||
  pathname.startsWith("/onboarding/create-org") ||
  pathname.startsWith("/onboarding/join-org") ||
  pathname.startsWith("/onboarding/create-project");

type PostAuthGuardProps = {
  children: ReactNode;
};

const PostAuthGuard = ({ children }: PostAuthGuardProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (needsOrganization(user)) {
      if (
        pathname.startsWith("/onboarding/create-project") ||
        pathname.startsWith("/onboarding/done")
      ) {
        router.replace("/onboarding");
      }
      return;
    }

    if (shouldCompleteProjectSetup(user)) {
      const isProjectSetupAllowed = PROJECT_SETUP_ALLOWED_PATHS.some((path) =>
        pathname.startsWith(path),
      );

      if (!isProjectSetupAllowed) {
        router.replace(getPostAuthPath(user));
      }
      return;
    }

    if (
      hasCompletedOnboarding(user) &&
      shouldRedirectCompletedUserFromOnboarding(pathname)
    ) {
      router.replace("/board");
    }
  }, [pathname, router, user]);

  return children;
};

export default PostAuthGuard;
