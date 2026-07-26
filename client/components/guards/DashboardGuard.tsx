"use client";

import useAuth from "@/lib/hooks/useAuth";
import {
  getPostAuthPath,
  hasCompletedOnboarding,
} from "@/lib/utils/postAuthPath";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type DashboardGuardProps = {
  children: ReactNode;
};

const DashboardGuard = ({ children }: DashboardGuardProps) => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!hasCompletedOnboarding(user)) {
      router.replace(getPostAuthPath(user));
    }
  }, [router, user]);

  return children;
};

export default DashboardGuard;
