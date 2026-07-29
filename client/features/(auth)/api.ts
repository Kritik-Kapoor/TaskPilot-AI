import { apiFetch } from "@/lib/utils/apiClient";
import type { LoginInputs, ProjectRole, RegisterInputs, User } from "./types";

export const loginUser = (data: LoginInputs) =>
  apiFetch<User>("/auth/signin", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Invalid credentials",
  });

export const registerUser = (data: RegisterInputs) =>
  apiFetch<User>("/auth/signup", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Failed to register",
  });

export const getCurrentUser = () =>
  apiFetch<User>("/auth/user", {
    method: "GET",
    fallbackErrorMessage: "Failed to fetch current user",
  });

export const getUserRoleInProject = (projectId: string) =>
  apiFetch<ProjectRole>(`/project/${projectId}/role`, {
    method: "GET",
    fallbackErrorMessage: "Failed to fetch project role",
  });

export const logoutUser = () =>
  apiFetch<null>("/auth/signout", {
    method: "POST",
    fallbackErrorMessage: "Failed to logout",
  });

export const getResetPasswordLink = (email: string) =>
  apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    fallbackErrorMessage: "Failed to reset password",
    responseType: "envelope",
  });

export const resetPassword = (data: {
  resetPasswordToken: string;
  newPassword: string;
}) =>
  apiFetch<null>("/auth/reset-password", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Failed to reset password",
  });
