export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export type User = {
  username: string;
  email: string;
  organizationId?: string | null;
  organizationRole?: OrganizationRole | null;
  organizationName?: string | null;
  organizationProjectCount?: number;
};

export type LoginInputs = {
  email: string;
  password: string;
};

export type RegisterInputs = {
  username: string;
  email: string;
  password: string;
  isPrivacyPolicyAccepted: boolean;
};

export type SignInResponse = User & {
  hasJoinedOrg: boolean;
};
