export const ONBOARDING_STEPS = [
  {
    id: "org",
    label: "Organization",
    match: ["/onboarding", "/onboarding/create-org", "/onboarding/join-org"],
  },
  {
    id: "project",
    label: "First project",
    match: ["/onboarding/create-project"],
  },
  { id: "done", label: "Ready to ship", match: ["/onboarding/done"] },
] as const;

export const getOnboardingStepIndex = (pathname: string) => {
  const index = ONBOARDING_STEPS.findIndex((step) =>
    step.match.some((path) => path === pathname),
  );

  return index === -1 ? 0 : index;
};
