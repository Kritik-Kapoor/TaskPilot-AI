"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { deleteAccount, updateProfile } from "@/features/(auth)/api";
import useAuth from "@/lib/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
  email: z.string(),
});

const useProfilePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading, logout } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["me"], updatedUser);
      toast.success("Profile updated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ["me"] });
      await logout();
      router.push("/sign-in");
      toast.success("Account deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account",
      );
    },
  });

  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
    },
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ username: value.username.trim() });
    },
  });

  useEffect(() => {
    if (!user) return;

    form.reset({
      username: user.username,
      email: user.email,
    });
  }, [form, user]);

  const openDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (deleteMutation.isPending) return;
    setIsDeleteDialogOpen(false);
  }, [deleteMutation.isPending]);

  const confirmDeleteAccount = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    user,
    form,
    isLoading,
    isSaving: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isDeleteDialogOpen,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteAccount,
  };
};

export default useProfilePage;
