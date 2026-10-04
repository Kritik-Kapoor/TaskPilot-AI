export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export type ProjectRole = "ADMIN" | "MEMBER" | "VIEWER";

export type UserProject = {
  projectId: string;
  projectName: string;
  role: ProjectRole;
};

export type User = {
  username: string;
  email: string;
  joinedOn?: string;
  organizationId?: string | null;
  organizationRole?: OrganizationRole | null;
  organizationName?: string | null;
  organizationProjectCount?: number;
  projects?: UserProject[];
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
