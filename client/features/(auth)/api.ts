import { apiFetch } from "@/lib/utils/apiClient";
import { RegisterInputs, User } from "./types";

export const loginUser = (data: { email: string; password: string }) =>
  apiFetch<User>("/auth/login", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Invalid credentials",
  });

export const registerUser = (data: RegisterInputs) =>
  apiFetch<User>("/auth/register", {
    method: "POST",
    body: data,
    fallbackErrorMessage: "Failed to register",
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
