import { apiFetch } from "@/lib/utils/apiClient";
import type {
  IncomingJoinRequest,
  ReviewJoinRequestAction,
} from "./types";

export const incomingJoinRequestsQueryKey = ["incoming-join-requests"] as const;

export const getIncomingJoinRequests = () =>
  apiFetch<IncomingJoinRequest[]>("/organization/join-requests/incoming", {
    fallbackErrorMessage: "Failed to fetch join requests",
  });

export const reviewJoinRequest = (
  requestId: string,
  action: ReviewJoinRequestAction,
) =>
  apiFetch<IncomingJoinRequest>(`/organization/join-requests/${requestId}`, {
    method: "PATCH",
    body: { action },
    fallbackErrorMessage: `Failed to ${action} join request`,
  });
