"use client";

import Link from "next/link";
import RegisterForm from "@/features/(auth)/components/RegisterForm";
import useSignupPage from "@/features/(auth)/hooks/useSignupPage";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/features/(auth)/components/AuthLayout";

const SignupPage = () => {
  const {
    state: { form, isPasswordVisible, loading },
    actions: { setIsPasswordVisible },
  } = useSignupPage();

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free forever for small teams. No credit card required."
    >
      <RegisterForm
        form={form}
        isPasswordVisible={isPasswordVisible}
        setIsPasswordVisible={setIsPasswordVisible}
        loading={loading}
      />
      <p className="text-sm text-center text-muted-foreground mt-3">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-brand font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
      <Separator className="my-4" />
      <p className="text-sm text-muted-foreground text-center">
        New to Taskpilot AI?{" "}
        <Button variant="link" asChild className="h-auto p-0 text-sm">
          <Link href="/">View app info</Link>
        </Button>
      </p>
    </AuthLayout>
  );
};

export default SignupPage;
