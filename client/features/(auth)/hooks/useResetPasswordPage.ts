"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { resetPassword } from "../api";
import { useAppForm } from "@/components/common/form/hooks";

const resetPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormTypes = ReturnType<
  typeof useResetPasswordPage
>["state"]["form"];

const useResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const resetPasswordToken = typeof token === "string" ? token : undefined;
  const invalidLink = !resetPasswordToken;

  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { resetPasswordToken: string; newPassword: string }) =>
      resetPassword(data),
    onSuccess: () => {
      toast.success("Password reset successfully");
      router.push("/login");
    },
    onError: () =>
      toast.error("Failed to reset password. The link may have expired."),
  });

  const form = useAppForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordFormSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
      //   if (!resetPasswordToken) return;
      // await resetPasswordMutation.mutate({
      //   resetPasswordToken,
      //   newPassword: data.newPassword,
      // });
    },
  });

  return {
    state: {
      form,
      isPasswordVisible,
      loading: resetPasswordMutation.isPending,
      invalidLink,
    },
    actions: { setIsPasswordVisible },
  };
};

export default useResetPasswordPage;
