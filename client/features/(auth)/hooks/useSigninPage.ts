"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/components/common/form/hooks";
import { loginUser } from "@/features/(auth)/api";
import type { LoginInputs } from "@/features/(auth)/types";

const loginFormSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => val.length > 7, {
      message: "Password must be at least 8 characters long",
    }),
});

export type LoginFormTypes = ReturnType<typeof useSigninPage>["state"]["form"];

const useSigninPage = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInputs) => loginUser(data),
    onSuccess: (response) => {
      // queryClient.setQueryData(["me"], response.user);
      router.push("/dashboard");
    },
    onError: () => toast.error("Invalid credentials"),
  });

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
      //   const res = await loginMutation.mutate(value);

      //   if (res.success) form.reset();
      //   else toast.error(res.error.message);
    },
  });

  return {
    state: { form, isPasswordVisible, loading: loginMutation.isPending },
    actions: { setIsPasswordVisible },
  };
};

export default useSigninPage;
