"use client";

import useAuth from "@/lib/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getIncomingJoinRequests,
  incomingJoinRequestsQueryKey,
  reviewJoinRequest,
} from "../api";
import { createJoinRequestTableColumns } from "../components/JoinRequestTableColumns";
import type { IncomingJoinRequest, ReviewJoinRequestAction } from "../types";

const useJoinRequestPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState<{
    requestId: string;
    action: ReviewJoinRequestAction;
  } | null>(null);

  const canManage =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";

  const {
    data: joinRequests = [],
    isPending: isJoinRequestsLoading,
    isError: isJoinRequestsError,
  } = useQuery({
    queryKey: incomingJoinRequestsQueryKey,
    queryFn: getIncomingJoinRequests,
    enabled: canManage,
  });

  const filteredJoinRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return joinRequests;

    return joinRequests.filter(
      (request) =>
        request.user.username.toLowerCase().includes(normalizedQuery) ||
        request.user.email.toLowerCase().includes(normalizedQuery) ||
        request.status.toLowerCase().includes(normalizedQuery),
    );
  }, [joinRequests, query]);

  const pendingCount = useMemo(
    () => joinRequests.filter((request) => request.status === "PENDING").length,
    [joinRequests],
  );

  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: ReviewJoinRequestAction;
    }) => reviewJoinRequest(requestId, action),
    onMutate: ({ requestId, action }) => {
      setReviewing({ requestId, action });
    },
    onSuccess: (updatedRequest, { action }) => {
      queryClient.setQueryData<IncomingJoinRequest[]>(
        incomingJoinRequestsQueryKey,
        (current = []) =>
          current.map((request) =>
            request.id === updatedRequest.id ? updatedRequest : request,
          ),
      );
      toast.success(
        action === "approve"
          ? `${updatedRequest.user.username} was added to the organization`
          : `Join request from ${updatedRequest.user.username} was declined`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to review join request",
      );
    },
    onSettled: () => {
      setReviewing(null);
    },
  });

  const handleReview = useCallback(
    (request: IncomingJoinRequest, action: ReviewJoinRequestAction) => {
      reviewMutation.mutate({ requestId: request.id, action });
    },
    [reviewMutation],
  );

  const columns = useMemo(
    () =>
      createJoinRequestTableColumns({
        canManage,
        reviewing,
        onApprove: (request) => handleReview(request, "approve"),
        onDecline: (request) => handleReview(request, "decline"),
      }),
    [canManage, handleReview, reviewing],
  );

  return {
    state: {
      query,
      joinRequests: filteredJoinRequests,
      totalCount: joinRequests.length,
      filteredCount: filteredJoinRequests.length,
      pendingCount,
      columns,
      canManage,
      isJoinRequestsLoading,
      isJoinRequestsError,
    },
    actions: {
      setQuery,
    },
  };
};

export default useJoinRequestPage;
