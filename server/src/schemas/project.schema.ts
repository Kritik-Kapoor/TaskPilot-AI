import { z } from "zod";
import { optionalDescriptionSchema, updateDescriptionSchema } from "./common.schema.js";

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

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdParams = z.infer<typeof projectIdParamsSchema>;
export type UpdateProjectMemberParams = z.infer<
  typeof updateProjectMemberParamsSchema
>;
export type UpdateProjectMemberBody = z.infer<
  typeof updateProjectMemberBodySchema
>;
