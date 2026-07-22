"use client";

import { Card } from "@/components/ui/card";
import useResetPasswordPage from "@/features/(auth)/hooks/useResetPasswordPage";
import ResetPasswordForm from "@/features/(auth)/components/ResetPasswordForm";

const ResetPasswordPage = () => {
  const {
    state: { form, isPasswordVisible, loading, invalidLink },
    actions: { setIsPasswordVisible },
  } = useResetPasswordPage();

  if (invalidLink) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-full max-w-sm p-4">
          <div className="mb-7 flex flex-col items-center justify-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Invalid link</h1>
            <p className="text-muted-foreground mt-1 text-center">
              The link you are trying to access may have expired or been used
              already.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4">
      <Card className="w-full max-w-sm p-4">
        <div className="mb-7 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight">Reset password</h1>
          <p className="text-muted-foreground mt-1 text-center">
            Choose a new password for your account
          </p>
        </div>
        <ResetPasswordForm
          form={form}
          isPasswordVisible={isPasswordVisible}
          setIsPasswordVisible={setIsPasswordVisible}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
