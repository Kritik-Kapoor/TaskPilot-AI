import { z } from "zod";
import { projectIdParamsSchema } from "./project.schema.js";

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  isPrivacyPolicyAccepted: z.literal(true, {
    message: "You must accept the privacy policy",
  }),
});

export const signinSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
});

export const getUserRoleInProjectSchema = z.object({
  projectId: projectIdParamsSchema.shape.projectId,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GetUserRoleInProjectInput = z.infer<
  typeof getUserRoleInProjectSchema
>;
