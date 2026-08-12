"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { createProject } from "@/features/(onboarding)/api";
import { isProjectScopedPath } from "@/features/(workspace)/lib/workspaceRoutes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const createProjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters long"),
});

export type CreateProjectDialogForm = ReturnType<
  typeof useCreateProjectDialog
>["form"];

const useCreateProjectDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: ({ project }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Project created successfully");
      setIsOpen(false);
      form.reset();

      const basePath = isProjectScopedPath(pathname) ? pathname : "/dashboard";
      const params = new URLSearchParams(searchParams.toString());
      params.set("projectId", project.id);
      router.push(`${basePath}?${params.toString()}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project",
      );
    },
  });

  const form = useAppForm({
    defaultValues: { name: "" },
    validators: {
      onSubmit: createProjectFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createProjectMutation.mutateAsync({ name: value.name.trim() });
    },
  });

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    form.reset();
  }, [form]);

  return {
    isOpen,
    open,
    close,
    form,
    isSubmitting: createProjectMutation.isPending,
  };
};

export default useCreateProjectDialog;
