import { apiFetch } from "@/lib/utils/apiClient";
import type {
  CreateOrganizationInputs,
  CreateProjectInputs,
  Organization,
  OrganizationDetails,
  OrganizationJoinRequest,
} from "./types";

type CreateProjectResponse = {
  project: {
    id: string;
    projectName: string;
    description: string | null;
  };
};

export const checkOrgNameAvailability = (name: string) =>
  apiFetch<Organization | null>(
    `/organization/check?name=${encodeURIComponent(name)}`,
    {
      fallbackErrorMessage: "Failed to check organization name",
    },
  );

export const searchOrganizations = (query: string) =>
  apiFetch<Organization[]>(
    `/organization/search?q=${encodeURIComponent(query)}`,
    {
      fallbackErrorMessage: "Failed to search organizations",
    },
  );

export const createOrganization = (data: CreateOrganizationInputs) =>
  apiFetch<Pick<Organization, "id" | "orgName">>("/organization/create", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Failed to create organization",
  });

export const getOrganization = () =>
  apiFetch<OrganizationDetails>("/organization", {
    fallbackErrorMessage: "Failed to fetch organization",
  });

export const getMyJoinRequests = () =>
  apiFetch<OrganizationJoinRequest[]>("/organization/join-requests", {
    fallbackErrorMessage: "Failed to fetch join requests",
  });

export const requestJoinOrganization = (organizationId: string) =>
  apiFetch<Pick<Organization, "id" | "orgName">>(
    `/organization/join-request/${organizationId}`,
    {
      method: "POST",
      fallbackErrorMessage: "Failed to send join request",
    },
  );

export const createProject = (data: CreateProjectInputs) =>
  apiFetch<CreateProjectResponse>("/project/create", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Failed to create project",
  });
