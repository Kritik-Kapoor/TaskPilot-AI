"use client";

import { useAppForm } from "@/components/common/form/hooks";
import {
  checkOrganizationName,
  createOrganization,
  createProject,
  joinOrganization,
  searchOrganizationsByQuery,
} from "@/features/onboarding/api";
import type {
  OnboardingPath,
  OnboardingStep,
  Organization,
} from "@/features/onboarding/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const organizationSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: "Organization name must be at least 2 characters",
    }),
});

const projectSchema = z.object({
  name: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 2, {
      message: "Project name must be at least 2 characters",
    }),
  description: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length >= 5, {
      message: "Description must be at least 5 characters",
    }),
});

export type OrganizationFormTypes = ReturnType<
  typeof useOnboardingPage
>["state"]["organizationForm"];

export type ProjectFormTypes = ReturnType<
  typeof useOnboardingPage
>["state"]["projectForm"];

const useOnboardingPage = () => {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>("choose-path");
  const [path, setPath] = useState<OnboardingPath | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [existingOrganization, setExistingOrganization] =
    useState<Organization | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [joiningOrganizationId, setJoiningOrganizationId] = useState<
    string | null
  >(null);

  const organizationForm = useAppForm({
    defaultValues: { name: "" },
    validators: { onSubmit: organizationSchema },
    onSubmit: async ({ value }) => {
      setIsCheckingName(true);
      setExistingOrganization(null);

      try {
        const existing = await checkOrganizationName(value.name);

        if (existing) {
          setExistingOrganization(existing);
          return;
        }

        await createOrganization(value.name);
        setOrganizationName(value.name);
        setStep("create-project");
      } catch {
        toast.error("Failed to validate organization name");
      } finally {
        setIsCheckingName(false);
      }
    },
  });

  const projectForm = useAppForm({
    defaultValues: { name: "", description: "" },
    validators: { onSubmit: projectSchema },
    onSubmit: async ({ value }) => {
      setIsCreatingProject(true);

      try {
        await createProject(value);
        toast.success("Onboarding complete!");
        router.push("/dashboard");
      } catch {
        toast.error("Failed to create project");
      } finally {
        setIsCreatingProject(false);
      }
    },
  });

  useEffect(() => {
    if (step !== "join-organization") {
      return;
    }

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const results = await searchOrganizationsByQuery(trimmedQuery);
        setSearchResults(results);
      } catch {
        toast.error("Failed to search organizations");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, step]);

  const selectPath = useCallback((selectedPath: OnboardingPath) => {
    setPath(selectedPath);
    setExistingOrganization(null);
    setSearchQuery("");
    setSearchResults([]);
    setStep(selectedPath === "create" ? "create-organization" : "join-organization");
  }, []);

  const goBack = useCallback(() => {
    setExistingOrganization(null);
    setSearchQuery("");
    setSearchResults([]);

    if (step === "create-project") {
      setStep("create-organization");
      return;
    }

    setStep("choose-path");
    setPath(null);
  }, [step]);

  const joinExistingOrganization = useCallback(
    async (organization: Organization) => {
      setJoiningOrganizationId(organization.id);

      try {
        await joinOrganization(organization);
        toast.success(`Joined ${organization.name}`);
        router.push("/dashboard");
      } catch {
        toast.error("Failed to join organization");
      } finally {
        setJoiningOrganizationId(null);
      }
    },
    [router],
  );

  const stepTitle: Record<OnboardingStep, string> = {
    "choose-path": "Get started",
    "create-organization": "Create organization",
    "create-project": "Create your first project",
    "join-organization": "Join organization",
  };

  const stepDescription: Record<OnboardingStep, string> = {
    "choose-path": "Choose how you'd like to get started with TaskPilot.",
    "create-organization": "Give your new organization a unique name.",
    "create-project": "Add the first project for your organization.",
    "join-organization": "Find and join your team's organization.",
  };

  return {
    state: {
      step,
      path,
      organizationName,
      existingOrganization,
      isCheckingName,
      isCreatingProject,
      searchQuery,
      searchResults,
      isSearching,
      joiningOrganizationId,
      organizationForm,
      projectForm,
      stepTitle: stepTitle[step],
      stepDescription: stepDescription[step],
    },
    actions: {
      selectPath,
      goBack,
      setSearchQuery,
      joinExistingOrganization,
    },
  };
};

export default useOnboardingPage;
