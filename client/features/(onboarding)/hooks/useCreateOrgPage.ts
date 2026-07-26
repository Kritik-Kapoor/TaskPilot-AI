"use client";

import {
  checkOrgNameAvailability,
  createOrganization,
  getOrganization,
} from "@/features/(onboarding)/api";
import { useCurrentUser } from "@/features/(auth)/hooks/useCurrentUser";
import { optionalDescriptionField } from "@/features/(onboarding)/lib/validation";
import { slugify } from "@/features/(onboarding)/lib/orgUtils";
import { useAppForm } from "@/components/common/form/hooks";
import { useDebounced } from "@/lib/hooks/useDebounced";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

export type NameStatus = "idle" | "checking" | "available" | "taken";

const createOrgFormSchema = z.object({
  orgName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters long"),
  description: optionalDescriptionField,
});

export type CreateOrgFormTypes = ReturnType<
  typeof useCreateOrgPage
>["state"]["form"];

const useCreateOrgPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();

  const isEditingExistingOrg =
    Boolean(user?.organizationId) && user?.organizationRole === "OWNER";

  const { data: existingOrganization, isLoading: isLoadingOrganization } =
    useQuery({
      queryKey: ["organization"],
      queryFn: getOrganization,
      enabled: isEditingExistingOrg,
    });

  const saveOrgMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async (organization) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
      const orgSlug = slugify(organization.orgName);
      router.push(`/onboarding/create-project?org=${orgSlug}`);
    },
    onError: () => {
      toast.error(
        isEditingExistingOrg
          ? "Something went wrong. Failed to update organization!"
          : "Something went wrong. Failed to create organization!",
      );
    },
  });

  const form = useAppForm({
    defaultValues: {
      orgName: "",
      description: "",
    },
    validators: {
      onSubmit: createOrgFormSchema,
    },
    onSubmit: async ({ value }) => {
      await saveOrgMutation.mutateAsync({
        orgName: value.orgName.trim(),
        ...(value.description.trim() && {
          description: value.description.trim(),
        }),
      });
    },
  });

  useEffect(() => {
    if (!existingOrganization) {
      return;
    }

    form.reset({
      orgName: existingOrganization.orgName,
      description: existingOrganization.description ?? "",
    });
  }, [existingOrganization, form]);

  const orgName = useSelector(form.store, (state) => state.values.orgName);
  const debouncedOrgName = useDebounced(orgName, 300);
  const slug = useMemo(() => slugify(orgName), [orgName]);

  const {
    data: orgNameAvailabilityCheckResult,
    isPending: orgNameCheckIsPending,
    isError: orgNameCheckError,
  } = useQuery({
    queryKey: ["org-name-check", debouncedOrgName.trim()],
    queryFn: () => checkOrgNameAvailability(debouncedOrgName.trim()),
    enabled: !!debouncedOrgName.trim(),
  });

  const isCheckingOrgName = Boolean(
    debouncedOrgName.trim() && orgNameCheckIsPending,
  );

  const status = useMemo((): NameStatus => {
    if (!debouncedOrgName.trim()) return "idle";
    if (isCheckingOrgName) return "checking";
    if (orgNameAvailabilityCheckResult) return "taken";
    if (orgNameAvailabilityCheckResult === null) return "available";
    return "idle";
  }, [debouncedOrgName, isCheckingOrgName, orgNameAvailabilityCheckResult]);

  const isInitializing =
    isLoadingUser || (isEditingExistingOrg && isLoadingOrganization);

  const canSubmit =
    !isInitializing &&
    status === "available" &&
    debouncedOrgName.trim().length >= 2 &&
    !saveOrgMutation.isPending;

  const submit = () => {
    if (!canSubmit) {
      if (status === "taken") {
        toast.error("Organization name is already taken");
      }
      return;
    }

    form.handleSubmit();
  };

  return {
    state: {
      form,
      orgName,
      slug,
      status,
      takenOrg: orgNameAvailabilityCheckResult ?? null,
      canSubmit,
      isSubmitting: saveOrgMutation.isPending,
      isInitializing,
      isEditingExistingOrg,
      isError: orgNameCheckError,
    },
    actions: {
      submit,
    },
  };
};

export default useCreateOrgPage;
