"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { createProject } from "@/features/(onboarding)/api";
import { optionalDescriptionField } from "@/features/(onboarding)/lib/validation";
import { deSlugify, slugify } from "@/features/(onboarding)/lib/orgUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const createProjectFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Project name must be at least 2 characters long" }),
  description: optionalDescriptionField,
});

export type CreateProjectFormTypes = ReturnType<
  typeof useCreateProjectPage
>["state"]["form"];

const useCreateProjectPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");
  const orgName = orgSlug ? deSlugify(orgSlug) : "your organization";

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: ({ project }) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Project created successfully");
      router.push(
        `/onboarding/done?org=${orgSlug ?? ""}&project=${encodeURIComponent(slugify(project.projectName))}&projectId=${project.id}`,
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onSubmit: createProjectFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createProjectMutation.mutateAsync({
        name: value.name.trim(),
        ...(value.description.trim() && {
          description: value.description.trim(),
        }),
      });
      form.reset();
    },
  });

  return {
    state: {
      orgName,
      form,
      isSubmitting: createProjectMutation.isPending,
    },
  };
};

export default useCreateProjectPage;
