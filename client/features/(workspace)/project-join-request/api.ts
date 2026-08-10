import { apiFetch } from "@/lib/utils/apiClient";
import type {
  IncomingProjectJoinRequest,
  ReviewProjectJoinRequestAction,
} from "./types";

export const incomingProjectJoinRequestsQueryKey = (projectId: string) =>
  ["incoming-project-join-requests", projectId] as const;

export const getIncomingProjectJoinRequests = (projectId: string) =>
  apiFetch<IncomingProjectJoinRequest[]>(
    `/project/${projectId}/join-requests`,
    {
      fallbackErrorMessage: "Failed to fetch project join requests",
    },
  );

export const reviewProjectJoinRequest = (
  projectId: string,
  requestId: string,
  action: ReviewProjectJoinRequestAction,
) =>
  apiFetch<IncomingProjectJoinRequest>(
    `/project/${projectId}/join-requests/${requestId}`,
    {
      method: "PATCH",
      body: { action },
      fallbackErrorMessage: `Failed to ${action} join request`,
    },
  );
