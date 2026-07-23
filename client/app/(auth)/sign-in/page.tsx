"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import LoginForm from "@/features/(auth)/components/LoginForm";
import useSigninPage from "@/features/(auth)/hooks/useSigninPage";
import AuthLayout from "@/features/(auth)/components/AuthLayout";
import { Separator } from "@/components/ui/separator";

const SignInPage = () => {
  const {
    state: { form, isPasswordVisible, loading },
    actions: { setIsPasswordVisible },
  } = useSigninPage();

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to Taskpilot AI"
      subtitle="Pick up where your team left off."
    >
      <LoginForm
        form={form}
        isPasswordVisible={isPasswordVisible}
        setIsPasswordVisible={setIsPasswordVisible}
        loading={loading}
      />
      <p className="text-sm text-center text-muted-foreground mt-3">
        New to Taskpilot?{" "}
        <Link
          href="/sign-up"
          className="text-brand font-medium hover:underline"
        >
          Create an account
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

export default SignInPage;
