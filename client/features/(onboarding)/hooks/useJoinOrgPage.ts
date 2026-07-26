"use client";

import {
  getMyJoinRequests,
  requestJoinOrganization,
  searchOrganizations,
} from "@/features/(onboarding)/api";
import type {
  JoinRequestStatus,
  Organization,
} from "@/features/(onboarding)/types";
import { useDebounced } from "@/lib/hooks/useDebounced";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const useJoinOrgPage = () => {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [requestingOrganizationId, setRequestingOrganizationId] = useState<
    string | null
  >(null);

  const debouncedQuery = useDebounced(query, 300);

  const {
    data: myJoinRequests = [],
    isPending: myJoinRequestsIsPending,
    isError: myJoinRequestsIsError,
  } = useQuery({
    queryKey: ["my-join-requests"],
    queryFn: getMyJoinRequests,
  });

  const {
    data: searchedOrganizations,
    isPending: searchedOrganizationsIsPending,
    isError: searchedOrganizationsIsError,
  } = useQuery({
    queryKey: ["organizations", debouncedQuery.trim()],
    queryFn: () => searchOrganizations(debouncedQuery.trim()),
    enabled: !!debouncedQuery.trim(),
  });

  const isSearchingOrganizations =
    Boolean(debouncedQuery.trim()) && searchedOrganizationsIsPending;

  const joinRequestStatusByOrgId = myJoinRequests.reduce<
    Record<string, JoinRequestStatus>
  >((acc, request) => {
    acc[request.organization.id] = request.status;
    return acc;
  }, {});

  const requestJoinMutation = useMutation({
    mutationFn: requestJoinOrganization,
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ["my-join-requests"] });
      toast.success(`Request sent to ${organization.orgName}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send join request");
    },
    onSettled: () => {
      setRequestingOrganizationId(null);
    },
  });

  const requestJoin = (organization: Organization) => {
    setRequestingOrganizationId(organization.id);
    requestJoinMutation.mutate(organization.id);
  };

  const getOrgJoinRequestStatus = (organizationId: string) =>
    joinRequestStatusByOrgId[organizationId];

  return {
    state: {
      query,
      searchedOrganizations,
      myJoinRequests,
      isSearching: isSearchingOrganizations,
      isLoadingJoinRequests: myJoinRequestsIsPending,
      joinRequestsError: myJoinRequestsIsError,
      requestingOrganizationId,
      searchError: searchedOrganizationsIsError,
      getOrgJoinRequestStatus,
    },
    actions: {
      setQuery,
      requestJoin,
    },
  };
};

export default useJoinOrgPage;
