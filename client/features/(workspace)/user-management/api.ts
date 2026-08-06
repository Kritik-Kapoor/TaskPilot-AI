import { apiFetch } from "@/lib/utils/apiClient";
import type {
  OrganizationUser,
  UpdateOrganizationUserPayload,
} from "./types";

export const organizationUsersQueryKey = ["organization-users"] as const;

export const getOrganizationUsers = () =>
  apiFetch<OrganizationUser[]>("/organization/users", {
    fallbackErrorMessage: "Failed to fetch organization users",
  });

export const updateOrganizationUser = (
  userId: string,
  payload: UpdateOrganizationUserPayload,
) =>
  apiFetch<OrganizationUser>(`/organization/users/${userId}`, {
    method: "PATCH",
    body: payload,
    fallbackErrorMessage: "Failed to update user",
  });
