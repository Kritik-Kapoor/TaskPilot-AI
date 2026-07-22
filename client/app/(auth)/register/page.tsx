"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import useRegisterPage from "@/features/(auth)/hooks/useRegisterPage";
import RegisterForm from "@/features/(auth)/components/RegisterForm";

const RegisterPage = () => {
  const {
    state: { form, isPasswordVisible, loading },
    actions: { setIsPasswordVisible },
  } = useRegisterPage();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 gap-3">
      <Card className="w-full max-w-sm p-4">
        <div className="mb-7 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>
        <RegisterForm
          form={form}
          isPasswordVisible={isPasswordVisible}
          setIsPasswordVisible={setIsPasswordVisible}
          loading={loading}
        />
        <p className="text-muted-foreground text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default RegisterPage;
