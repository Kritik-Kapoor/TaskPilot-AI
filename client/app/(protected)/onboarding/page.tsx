import ChoosePathOptions from "@/features/(onboarding)/components/ChoosePathOptions";
import { PROJECT_NAME } from "@/lib/constants/utils";

const OnboardingPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Get started</h1>
      <p className="mt-2 text-muted-foreground">
        Choose how you&apos;d like to get started with {PROJECT_NAME}.
      </p>
      <div className="mt-8">
        <ChoosePathOptions />
      </div>
    </div>
  );
};

export default OnboardingPage;
