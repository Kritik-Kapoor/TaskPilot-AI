export type OrganizationDetails = {
  id: string;
  orgName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  members: Array<{
    id: string;
    username: string;
    email: string;
    organizationRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  }>;
  projects: Array<{
    id: string;
    projectName: string;
    description: string | null;
    memberCount: number;
    memberPreview: Array<{
      id: string;
      username: string;
    }>;
  }>;
};
