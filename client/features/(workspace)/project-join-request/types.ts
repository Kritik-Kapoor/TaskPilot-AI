import type { JoinRequestStatus } from "@/features/(onboarding)/types";

export type IncomingProjectJoinRequest = {
  id: string;
  status: JoinRequestStatus;
  requestedOn: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
};

export type ReviewProjectJoinRequestAction = "approve" | "decline";
