export type Organization = {
  id: string;
  orgName: string;
  projectCount: number;
  memberCount: number;
};

export type JoinRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export type OrganizationJoinRequest = {
  id: string;
  status: JoinRequestStatus;
  createdAt: string;
  organization: Organization;
};

export type OrganizationDetails = {
  id: string;
  orgName: string;
  description: string | null;
  owner: {
    id: string;
    username: string;
  };
};

export type OnboardingStep =
  | "choose-path"
  | "create-organization"
  | "create-project"
  | "join-organization";

export type OnboardingPath = "create" | "join";

export type CreateOrganizationInputs = {
  orgName: string;
  description?: string;
};

export type CreateProjectInputs = {
  name: string;
  description?: string;
};
