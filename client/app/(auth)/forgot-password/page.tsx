"use client";

import { Card } from "@/components/ui/card";
import ForgetPasswordForm from "@/features/(auth)/components/ForgetPasswordForm";
import useForgotPasswordPage from "@/features/(auth)/hooks/useForgotPasswordPage";
import Link from "next/link";

const ForgotPasswordPage = () => {
  const {
    state: { form, loading, showSuccessMessage },
  } = useForgotPasswordPage();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <Card className="w-full max-w-sm p-4">
        <div className="mb-5 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Forgot password?
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter your registered email to reset your password
          </p>
        </div>

        <ForgetPasswordForm form={form} loading={loading} />

        <p className="text-muted-foreground text-sm text-center">
          Remember your password?
          <Link href="/login" className="text-blue-500 ml-1">
            Login
          </Link>
        </p>
        {showSuccessMessage && (
          <div className="bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-xl">
            <p className="text-foreground text-sm text-center">
              {showSuccessMessage}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
