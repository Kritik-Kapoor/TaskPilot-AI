"use client";

type OnboardingStepIndicatorProps = {
  steps: ReadonlyArray<{
    id: string;
    label: string;
    match: ReadonlyArray<string>;
  }>;
  activeIndex: number;
};

const OnboardingStepIndicator = ({
  steps,
  activeIndex,
}: OnboardingStepIndicatorProps) => {
  return (
    <ol className="mb-10 flex items-center gap-3">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;

        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                  isDone
                    ? "bg-brand text-brand-foreground"
                    : isActive
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`truncate text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
};

export default OnboardingStepIndicator;
