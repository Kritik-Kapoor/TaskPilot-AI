export type Organization = {
  id: string;
  name: string;
  projectCount: number;
  memberCount: number;
};

export type OnboardingStep =
  | "choose-path"
  | "create-organization"
  | "create-project"
  | "join-organization";

export type OnboardingPath = "create" | "join";

export type CreateOrganizationInputs = {
  name: string;
};

export type CreateProjectInputs = {
  name: string;
  description: string;
};
