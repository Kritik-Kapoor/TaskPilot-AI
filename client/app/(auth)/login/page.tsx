"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import useLoginPage from "@/features/(auth)/hooks/useLoginPage";
import LoginForm from "@/features/(auth)/components/LoginForm";

const LoginPage = () => {
  const {
    state: { form, isPasswordVisible, loading },
    actions: { setIsPasswordVisible },
  } = useLoginPage();

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 gap-3">
      <Card className="w-full max-w-sm p-4">
        <div className="mb-7 flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>
        <LoginForm
          form={form}
          isPasswordVisible={isPasswordVisible}
          setIsPasswordVisible={setIsPasswordVisible}
          loading={loading}
        />
        <p className="text-muted-foreground text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-500">
            Register
          </Link>
        </p>
      </Card>
      <p className="text-sm text-muted-foreground text-center">
        New to Million Todos?{" "}
        <Button variant="link" asChild className="h-auto p-0 text-sm">
          <Link href="/">View app info</Link>
        </Button>
      </p>
    </div>
  );
};

export default LoginPage;
