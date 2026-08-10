"use client";

import useAuth from "@/lib/hooks/useAuth";
import {
  getOrganizationDetails,
  organizationDetailsQueryKey,
} from "@/features/(workspace)/organization/api";
import { useQuery } from "@tanstack/react-query";

const useOrganizationPage = () => {
  const { user } = useAuth();

  const {
    data: organization,
    isPending,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: organizationDetailsQueryKey,
    queryFn: getOrganizationDetails,
  });

  const isOrgAdmin =
    user?.organizationRole === "OWNER" || user?.organizationRole === "ADMIN";

  return {
    organization,
    isLoading: isPending,
    isError,
    isRefreshing: isFetching,
    isOrgAdmin,
    refetch,
  };
};

export default useOrganizationPage;
