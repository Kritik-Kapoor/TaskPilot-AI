"use client";

import useAuth from "@/lib/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type AuthGuardProps = {
  children: ReactNode;
  redirectTo?: string;
};

const AuthGuard = ({ children, redirectTo = "/dashboard" }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return children;
};

export default AuthGuard;
