import type { JoinRequestStatus } from "@/features/(onboarding)/types";

export type IncomingJoinRequest = {
  id: string;
  status: JoinRequestStatus;
  requestedOn: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
};

export type ReviewJoinRequestAction = "approve" | "decline";
