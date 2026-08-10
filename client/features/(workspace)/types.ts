import type { JoinRequestStatus } from "@/features/(onboarding)/types";

export type ProjectMemberPreview = {
  username: string;
};

export type Project = {
  id: string;
  projectName: string;
  projectKey: string;
  description: string | null;
  memberCount: number;
  ticketCount: number;
  memberPreview: ProjectMemberPreview[];
  isJoined: boolean;
  role: string | null;
  joinRequestStatus: JoinRequestStatus | null;
};

export type ProjectMember = {
  role: string;
  id: string;
  username: string;
  email: string;
};

export type ProjectLabel = {
  id: string;
  name: string;
  color: string;
};
