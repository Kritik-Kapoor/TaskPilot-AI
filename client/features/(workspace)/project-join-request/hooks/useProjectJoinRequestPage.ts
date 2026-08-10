"use client";

import { useProject } from "@/providers/projectProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  getIncomingProjectJoinRequests,
  incomingProjectJoinRequestsQueryKey,
  reviewProjectJoinRequest,
} from "../api";
import { createProjectJoinRequestTableColumns } from "../components/ProjectJoinRequestTableColumns";
import type {
  IncomingProjectJoinRequest,
  ReviewProjectJoinRequestAction,
} from "../types";

const useProjectJoinRequestPage = () => {
  const queryClient = useQueryClient();
  const { activeProject, isProjectAdmin } = useProject();

  const projectId = activeProject?.id ?? null;

  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState<{
    requestId: string;
    action: ReviewProjectJoinRequestAction;
  } | null>(null);

  const {
    data: joinRequests = [],
    isPending: isJoinRequestsLoading,
    isError: isJoinRequestsError,
  } = useQuery({
    queryKey: incomingProjectJoinRequestsQueryKey(projectId ?? ""),
    queryFn: () => getIncomingProjectJoinRequests(projectId!),
    enabled: isProjectAdmin && Boolean(projectId),
  });

  const filteredJoinRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return joinRequests;

    return joinRequests.filter(
      (r) =>
        r.user.username.toLowerCase().includes(normalizedQuery) ||
        r.user.email.toLowerCase().includes(normalizedQuery) ||
        r.status.toLowerCase().includes(normalizedQuery),
    );
  }, [joinRequests, query]);

  const pendingCount = useMemo(
    () => joinRequests.filter((r) => r.status === "PENDING").length,
    [joinRequests],
  );

  const reviewMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: ReviewProjectJoinRequestAction;
    }) => reviewProjectJoinRequest(projectId!, requestId, action),
    onMutate: ({ requestId, action }) => {
      setReviewing({ requestId, action });
    },
    onSuccess: (updatedRequest, { action }) => {
      queryClient.setQueryData<IncomingProjectJoinRequest[]>(
        incomingProjectJoinRequestsQueryKey(projectId!),
        (current = []) =>
          current.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)),
      );
      toast.success(
        action === "approve"
          ? `${updatedRequest.user.username} was added to the project`
          : `Join request from ${updatedRequest.user.username} was declined`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to review join request",
      );
    },
    onSettled: () => {
      setReviewing(null);
    },
  });

  const handleReview = useCallback(
    (requestId: string, action: ReviewProjectJoinRequestAction) => {
      reviewMutation.mutate({ requestId, action });
    },
    [reviewMutation],
  );

  const columns = useMemo(
    () =>
      createProjectJoinRequestTableColumns({
        reviewing,
        onApprove: (request) => handleReview(request.id, "approve"),
        onDecline: (request) => handleReview(request.id, "decline"),
      }),
    [handleReview, reviewing],
  );

  return {
    state: {
      query,
      activeProject,
      isProjectAdmin,
      joinRequests: filteredJoinRequests,
      totalCount: joinRequests.length,
      filteredCount: filteredJoinRequests.length,
      pendingCount,
      columns,
      isJoinRequestsLoading,
      isJoinRequestsError,
    },
    actions: {
      setQuery,
    },
  };
};

export default useProjectJoinRequestPage;
