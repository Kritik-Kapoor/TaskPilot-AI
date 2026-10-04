"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { deleteProject, updateProject } from "@/features/(workspace)/api";
import useAuth from "@/lib/hooks/useAuth";
import { useProject } from "@/providers/projectProvider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const settingsSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters long"),
  projectKey: z.string(),
  description: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      if (!value) return;

      if (value.length < 20) {
        ctx.addIssue({
          code: "custom",
          message: "Description must be at least 20 characters long",
        });
      }

      if (value.length > 500) {
        ctx.addIssue({
          code: "custom",
          message: "Description must be less than 500 characters long",
        });
      }
    }),
});

const useSettingsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeProject, isProjectAdmin, isLoading } = useProject();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canManage = useMemo(
    () =>
      isProjectAdmin ||
      user?.organizationRole === "OWNER" ||
      user?.organizationRole === "ADMIN",
    [isProjectAdmin, user?.organizationRole],
  );

  const isDefaultProject = activeProject?.isDefault ?? false;
  const canDelete = isProjectAdmin && !isDefaultProject;

  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; description: string | null }) => {
      if (!activeProject) {
        throw new Error("No active project");
      }

      return updateProject(activeProject.id, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project settings updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update project",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!activeProject) {
        throw new Error("No active project");
      }

      return deleteProject(activeProject.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/board");
      toast.success("Project deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    },
  });

  const projectId = activeProject?.id;
  const projectName = activeProject?.projectName ?? "";
  const projectKey = activeProject?.projectKey ?? "";
  const projectDescription = activeProject?.description ?? "";

  const defaultValues = useMemo(
    () => ({
      projectName,
      projectKey,
      description: projectDescription,
    }),
    [projectName, projectKey, projectDescription],
  );

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: settingsSchema,
    },
    onSubmit: ({ value }) => {
      if (!canManage) return;

      updateMutation.mutate({
        name: value.projectName.trim(),
        description: value.description.trim() ? value.description.trim() : null,
      });
    },
  });

  useEffect(() => {
    if (!projectId) return;

    form.reset(defaultValues);
  }, [projectId, defaultValues, form]);

  const openDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (deleteMutation.isPending) return;
    setIsDeleteDialogOpen(false);
  }, [deleteMutation.isPending]);

  const confirmDeleteProject = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    activeProject,
    form,
    canManage,
    canDelete,
    isDefaultProject,
    isLoading,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteProject,
  };
};

export default useSettingsPage;
