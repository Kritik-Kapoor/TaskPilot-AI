import { apiFetch } from "@/lib/utils/apiClient";
import type { OrganizationDetails } from "./types";

export const organizationDetailsQueryKey = ["organization-details"] as const;

export const getOrganizationDetails = () =>
  apiFetch<OrganizationDetails>("/organization", {
    fallbackErrorMessage: "Failed to fetch organization details",
  });
