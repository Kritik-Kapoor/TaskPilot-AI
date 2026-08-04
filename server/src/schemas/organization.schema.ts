import { z } from "zod";
import {
  optionalDescriptionSchema,
  updateDescriptionSchema,
} from "./common.schema.js";

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
    description: updateDescriptionSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.orgName === undefined && data.description === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one field to update",
      });
    }
  });

export const searchOrganizationsQuerySchema = z.object({
  q: z.string().trim().optional(),
});

export const checkOrganizationNameQuerySchema = z.object({
  name: z.string().trim().optional(),
});

export const organizationIdParamsSchema = z.object({
  orgId: z.uuid("Invalid organization ID"),
});

export const transferOwnershipParamsSchema = z.object({
  newOwnerId: z.uuid("Invalid user ID"),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type SearchOrganizationsQuery = z.infer<
  typeof searchOrganizationsQuerySchema
>;
export type CheckOrganizationNameQuery = z.infer<
  typeof checkOrganizationNameQuerySchema
>;
export type OrganizationIdParams = z.infer<typeof organizationIdParamsSchema>;
export type TransferOwnershipParams = z.infer<
  typeof transferOwnershipParamsSchema
>;

export const joinRequestIdParamsSchema = z.object({
  requestId: z.uuid("Invalid join request ID"),
});

export const reviewJoinRequestBodySchema = z.object({
  action: z.enum(["approve", "decline"]),
});

export type JoinRequestIdParams = z.infer<typeof joinRequestIdParamsSchema>;
export type ReviewJoinRequestBody = z.infer<typeof reviewJoinRequestBodySchema>;
