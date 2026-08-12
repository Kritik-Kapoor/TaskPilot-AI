import { z } from "zod";
import {
  optionalDescriptionSchema,
  updateDescriptionSchema,
} from "./common.schema.js";

export const projectRoleSchema = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const projectMemberActionSchema = z.enum(["add", "remove", "update"]);

export const projectIdParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
});

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters long"),
  description: optionalDescriptionSchema,
});

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters long")
      .optional(),
    description: updateDescriptionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.name === undefined && data.description === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one field to update",
      });
    }
  });

export const updateProjectMemberParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  action: projectMemberActionSchema,
});

export const updateProjectMemberBodySchema = z.object({
  userToUpdateId: z.uuid("Invalid user ID"),
  role: projectRoleSchema.optional(),
});

export const projectMemberUserIdParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  userId: z.uuid("Invalid user ID"),
});

export const patchProjectMemberBodySchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long"),
  role: projectRoleSchema,
});

export const createLabelBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Label name must be at least 2 characters long"),
  color: z
    .string()
    .trim()
    .min(2, "Label color must be at least 2 characters long"),
});

export const updateLabelParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  labelId: z.uuid("Invalid label ID"),
});

export const updateIssueTypeParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  typeId: z.uuid("Invalid ticket type ID"),
});

export const updateIssueTypeBodySchema = z.object({
  isEnabled: z.boolean(),
  key: z.string().trim().min(2, "Key must be at least 2 characters"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
});

export const createIssueTypeBodySchema = z.object({
  key: z.string().trim().min(2, "Key must be at least 2 characters"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
});

export const boardColumnParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  columnId: z.uuid("Invalid column ID"),
});

export const boardColumnBodySchema = z.object({
  name: z.string().trim().min(2, "Column name must be at least 2 characters"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
});

export const reorderBoardColumnsBodySchema = z.object({
  columnId: z.uuid("Invalid column ID"),
  newPosition: z.number().int("Position must be an integer"),
});

export type ReorderBoardColumnsBody = z.infer<
  typeof reorderBoardColumnsBodySchema
>;
export type CreateIssueTypeBody = z.infer<typeof createIssueTypeBodySchema>;
export type BoardColumnParams = z.infer<typeof boardColumnParamsSchema>;
export type BoardColumnBody = z.infer<typeof boardColumnBodySchema>;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
export type UpdateProjectMemberParams = z.infer<
  typeof updateProjectMemberParamsSchema
>;
export type UpdateProjectMemberBody = z.infer<
  typeof updateProjectMemberBodySchema
>;
export type ProjectMemberUserIdParams = z.infer<
  typeof projectMemberUserIdParamsSchema
>;
export type PatchProjectMemberBody = z.infer<
  typeof patchProjectMemberBodySchema
>;
export const projectJoinRequestIdParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  requestId: z.uuid("Invalid join request ID"),
});

export const reviewProjectJoinRequestBodySchema = z.object({
  action: z.enum(["approve", "decline"]),
});

export type CreateLabelBody = z.infer<typeof createLabelBodySchema>;
export type UpdateLabelParams = z.infer<typeof updateLabelParamsSchema>;
export type UpdateIssueTypeParams = z.infer<typeof updateIssueTypeParamsSchema>;
export type UpdateIssueTypeBody = z.infer<typeof updateIssueTypeBodySchema>;
export type ProjectJoinRequestIdParams = z.infer<
  typeof projectJoinRequestIdParamsSchema
>;
