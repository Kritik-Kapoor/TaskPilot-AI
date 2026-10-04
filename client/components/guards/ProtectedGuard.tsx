"use client";

import { Button } from "@/components/ui/button";
import { getProjects, joinDefaultProject } from "@/features/(workspace)/api";
import useAuth from "@/lib/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type ProtectedGuardProps = {
  children: ReactNode;
};

const AUTH_LOADING_MESSAGES = [
  "Checking your session…",
  "Verifying access…",
] as const;

const PROJECTS_LOADING_MESSAGES = [
  "Loading your workspace…",
  "Fetching projects…",
  "Almost ready…",
] as const;

const JOIN_DEFAULT_MESSAGES = [
  "Adding you to the default project…",
  "Refreshing your workspace…",
  "Opening the board…",
] as const;

const MESSAGE_STEP_MS = 1600;

const GuardLoading = ({ messages }: { messages: readonly string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= messages.length - 1) return;

    const timer = window.setTimeout(() => {
      setIndex((current) => current + 1);
    }, MESSAGE_STEP_MS);

    return () => window.clearTimeout(timer);
  }, [index, messages.length]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{messages[index]}</p>
    </div>
  );
};

const ProtectedGuard = ({ children }: ProtectedGuardProps) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: projects, isPending: isProjectsPending } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isAuthenticated,
  });

  const joinDefaultMutation = useMutation({
    mutationFn: joinDefaultProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.replace("/board");
    },
  });

  const hasNoProjects =
    projects !== undefined && !projects.some((project) => project.isJoined);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.replace("/sign-in");
    } else if (hasNoProjects && joinDefaultMutation.isIdle) {
      joinDefaultMutation.mutate();
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    hasNoProjects,
    joinDefaultMutation,
    router,
  ]);

  if (isAuthLoading) {
    return <GuardLoading key="auth" messages={AUTH_LOADING_MESSAGES} />;
  }

  if (isAuthenticated && isProjectsPending) {
    return <GuardLoading key="projects" messages={PROJECTS_LOADING_MESSAGES} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (hasNoProjects) {
    if (joinDefaultMutation.isError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            {joinDefaultMutation.error.message}
          </p>
          <Button size="sm" onClick={() => joinDefaultMutation.mutate()}>
            Try again
          </Button>
        </div>
      );
    }

    return <GuardLoading key="join-default" messages={JOIN_DEFAULT_MESSAGES} />;
  }

  return children;
};

export default ProtectedGuard;
