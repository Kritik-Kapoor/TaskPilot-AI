import { z } from "zod";
import { optionalDescriptionSchema } from "./common.schema.js";

export const orgNameSchema = z
  .string()
  .trim()
  .min(2, "Organization name must be at least 2 characters long");

export const createOrganizationSchema = z.object({
  orgName: orgNameSchema,
  description: optionalDescriptionSchema,
});

export const updateOrganizationSchema = z
  .object({
    orgName: orgNameSchema.optional(),
    description: optionalDescriptionSchema,
  })
  .superRefine((data, ctx) => {
    if (data.orgName === undefined && data.description === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one field to update",
      });
    }
  });

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
