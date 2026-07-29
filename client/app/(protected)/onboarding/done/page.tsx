"use client";

import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import useDonePage from "@/features/(onboarding)/hooks/useDonePage";

const DonePage = () => {
  const {
    state: { progress, statusLabel, projectName, shouldInitialize, dashboardHref },
  } = useDonePage();

  const subtitle = projectName
    ? `"${projectName}" is ready. We're getting everything set up for you.`
    : "Your workspace is ready. We're getting everything set up for you.";

  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-success/15">
        <CheckCircle2 className="h-7 w-7 text-success" />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">
        You&apos;re all set
      </h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>

      {shouldInitialize ? (
        <div className="mx-auto mt-8 max-w-md space-y-4 text-left">
          <Progress value={progress} className="h-2" />
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {statusLabel}
          </p>
        </div>
      ) : (
        <Button
          asChild
          className="mt-8 bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
        >
          <Link href={dashboardHref}>Go to dashboard</Link>
        </Button>
      )}
    </div>
  );
};

export default DonePage;
