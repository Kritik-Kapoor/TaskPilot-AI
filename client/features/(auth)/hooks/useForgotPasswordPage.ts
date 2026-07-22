"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import z from "zod";
import { getResetPasswordLink } from "../api";
import { useState } from "react";
import { useAppForm } from "@/components/common/form/hooks";

const forgotFormSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export type ForgetPasswordFormTypes = ReturnType<
  typeof useForgotPasswordPage
>["state"]["form"];

const useForgotPasswordPage = () => {
  const [showSuccessMessage, setShowSuccessMessage] = useState("");

  const forgotMutation = useMutation({
    mutationFn: getResetPasswordLink,
    onSuccess: ({ message }) => {
      setShowSuccessMessage(message);
      form.reset();
    },
    onError: () => {
      setShowSuccessMessage("");
      toast.error("Invalid credentials");
    },
  });
  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotFormSchema,
    },
    onSubmit: async ({ value }) => {
      setShowSuccessMessage("");
      console.log(value);
      //   const res = await forgotMutation.mutate(value.email);

      //   if (res.success) form.reset();
      //   else toast.error(res.error.message);
    },
  });

  return {
    state: { form, loading: forgotMutation.isPending, showSuccessMessage },
  };
};

export default useForgotPasswordPage;
