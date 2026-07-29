"use client";

import { workspacePath } from "@/features/(workspace)/lib/projectUrl";
import { useEffect, useState } from "react";
import { deSlugify } from "../lib/orgUtils";
import { useRouter, useSearchParams } from "next/navigation";

const INITIALIZATION_DURATION_MS = 3000;

const INITIALIZATION_STEPS = [
  { threshold: 0, label: "Initializing your workspace..." },
  { threshold: 35, label: "Setting up your dashboard..." },
  { threshold: 70, label: "Almost ready..." },
] as const;

const getInitializationLabel = (progress: number) => {
  const step = [...INITIALIZATION_STEPS]
    .reverse()
    .find(({ threshold }) => progress >= threshold);

  return step?.label ?? INITIALIZATION_STEPS[0].label;
};

const useDonePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project");
  const projectId = searchParams.get("projectId");

  const projectName = projectSlug ? deSlugify(projectSlug) : null;
  const shouldInitialize = Boolean(projectSlug);
  const dashboardHref = projectId
    ? workspacePath("/dashboard", projectId)
    : "/dashboard";

  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState<string>(
    INITIALIZATION_STEPS[0].label,
  );

  useEffect(() => {
    if (!shouldInitialize) return;

    const startTime = Date.now();

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(
        100,
        (elapsed / INITIALIZATION_DURATION_MS) * 100,
      );

      setProgress(nextProgress);
      setStatusLabel(getInitializationLabel(nextProgress));
    }, 50);

    const timeoutId = window.setTimeout(() => {
      router.push(dashboardHref);
    }, INITIALIZATION_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [dashboardHref, shouldInitialize, router]);

  return {
    state: {
      progress,
      statusLabel,
      projectName,
      shouldInitialize,
      dashboardHref,
    },
  };
};

export default useDonePage;
