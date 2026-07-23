"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const DonePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const project = searchParams.get("project");

  useEffect(() => {
    if (!project) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push("/dashboard");
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [project, router]);

  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/15">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        You&apos;re all set
      </h1>
      <p className="mt-2 text-muted-foreground">
        {project
          ? "Your workspace is ready. Redirecting to dashboard..."
          : "You can finish project setup anytime from your dashboard."}
      </p>
      <Button
        asChild
        className="mt-8 bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
      >
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
};

export default DonePage;
