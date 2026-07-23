"use client";

import OnboardingStepIndicator from "@/features/onboarding/components/OnboardingStepIndicator";
import {
  ONBOARDING_STEPS,
  getOnboardingStepIndex,
} from "@/features/onboarding/constants";
import { PROJECT_NAME } from "@/lib/constants/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const activeIndex = getOnboardingStepIndex(pathname);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-sm font-bold text-brand-foreground">
              T
            </div>
            <span className="font-semibold tracking-tight">{PROJECT_NAME}</span>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 pt-10 pb-16">
        <OnboardingStepIndicator
          steps={ONBOARDING_STEPS}
          activeIndex={activeIndex}
        />
        {children}
      </div>
    </div>
  );
};

export default OnboardingLayout;
