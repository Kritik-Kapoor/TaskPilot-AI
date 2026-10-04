"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { registerUser } from "@/features/(auth)/api";
import { useAppForm } from "@/components/common/form/hooks";

const registerFormSchema = z.object({
  username: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 2, {
      message: "Username must be at least 3 characters long",
    }),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 7, {
      message: "Password must be at least 8 characters long",
    }),
  privacyPolicy: z.boolean().refine((val) => val, {
    message: "You must agree to the privacy policy",
  }),
});

export type RegisterFormTypes = ReturnType<
  typeof useSignupPage
>["state"]["form"];

const useSignupPage = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
      router.push("/board");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register");
    },
  });

  const form = useAppForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      privacyPolicy: false,
    },
    validators: {
      onSubmit: registerFormSchema,
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync({
        username: value.username,
        email: value.email,
        password: value.password,
        isPrivacyPolicyAccepted: value.privacyPolicy,
      });
      form.reset();
    },
  });

  return {
    state: { form, isPasswordVisible, loading: registerMutation.isPending },
    actions: { setIsPasswordVisible },
  };
};

export default useSignupPage;
