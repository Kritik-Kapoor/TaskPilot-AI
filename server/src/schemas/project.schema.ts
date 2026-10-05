import { z } from "zod";
import { optionalDescriptionSchema } from "./common.schema.js";

export const projectRoleSchema = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const projectMemberActionSchema = z.enum(["add", "remove", "update"]);

export const projectIdParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
});

export const updateProjectDefaultParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  isDefault: z
    .enum(["true", "false"], {
      error: "Default status must be either true or false",
    })
    .transform((value) => value === "true"),
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
    description: optionalDescriptionSchema,
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

const issueTypeKeySchema = z
  .string({ error: "Key is required" })
  .trim()
  .min(2, "Key must be at least 2 characters");

const issueTypeColorSchema = z
  .string({ error: "Color is required" })
  .trim()
  .min(1, "Color is required")
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color");

export const updateIssueTypeBodySchema = z
  .object({
    isEnabled: z.boolean().optional(),
    key: issueTypeKeySchema.optional(),
    color: issueTypeColorSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasKey = data.key !== undefined;
    const hasColor = data.color !== undefined;
    const hasIsEnabled = data.isEnabled !== undefined;

    if (hasKey && !hasColor) {
      ctx.addIssue({
        code: "custom",
        message: "Color is required when key is provided",
        path: ["color"],
      });
    }

    if (hasColor && !hasKey) {
      ctx.addIssue({
        code: "custom",
        message: "Key is required when color is provided",
        path: ["key"],
      });
    }

    if (!hasKey && !hasColor && !hasIsEnabled) {
      ctx.addIssue({
        code: "custom",
        message:
          "Provide isEnabled to toggle the issue type, or both key and color to update its details",
      });
    }
  });

export const createIssueTypeBodySchema = z.object({
  key: issueTypeKeySchema,
  color: issueTypeColorSchema,
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

export const deleteBoardColumnBodySchema = z.preprocess(
  (value) => (value === undefined || value === null ? {} : value),
  z.object({
    ticketDisposition: z.enum(["move", "delete_all"]).optional(),
    targetColumnId: z.uuid("Invalid target column ID").optional(),
  }),
);

export type DeleteBoardColumnBody = z.infer<typeof deleteBoardColumnBodySchema>;

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
export type UpdateProjectDefaultParams = z.infer<
  typeof updateProjectDefaultParamsSchema
>;
export type CreateLabelBody = z.infer<typeof createLabelBodySchema>;
export type UpdateLabelParams = z.infer<typeof updateLabelParamsSchema>;
export type UpdateIssueTypeParams = z.infer<typeof updateIssueTypeParamsSchema>;
export type UpdateIssueTypeBody = z.infer<typeof updateIssueTypeBodySchema>;
