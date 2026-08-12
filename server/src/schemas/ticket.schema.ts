import { z } from "zod";

export const ticketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

const ticketDescriptionSchema = z.looseObject({ type: z.literal("doc") });

export const ticketIdParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  ticketId: z.uuid("Invalid ticket ID"),
});

export const createTicketSchema = z
  .object({
    projectId: z.uuid("Invalid project ID"),
    columnId: z.uuid("Invalid column ID").optional(),
    columnName: z
      .enum(["backlog", "todo", "in_progress", "in_review", "done"])
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(140, "Title must be 140 characters or less"),
    description: ticketDescriptionSchema.optional(),
    priority: ticketPrioritySchema.optional(),
    typeId: z.uuid("Invalid issue type ID").nullable().optional(),
    assigneeId: z.uuid("Invalid assignee ID").nullable().optional(),
    storyPoints: z
      .number()
      .int("Story points must be a whole number")
      .min(0, "Story points cannot be negative")
      .max(100, "Story points cannot exceed 100")
      .nullable()
      .optional(),
    labels: z.array(z.string().trim().min(1)).max(8).optional(),
    position: z
      .number()
      .int("Position must be a whole number")
      .positive("Position must be positive")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.columnId && !data.columnName) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either columnId or columnName",
        path: ["columnId"],
      });
    }

    if (data.columnId && data.columnName) {
      ctx.addIssue({
        code: "custom",
        message: "Provide only one of columnId or columnName",
        path: ["columnName"],
      });
    }
  });

export const updateTicketSchema = z
  .object({
    columnId: z.uuid("Invalid column ID").optional(),
    position: z
      .number()
      .int("Position must be a whole number")
      .positive("Position must be positive")
      .optional(),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(140, "Title must be 140 characters or less")
      .optional(),
    description: ticketDescriptionSchema.nullable().optional(),
    priority: ticketPrioritySchema.optional(),
    typeId: z.uuid("Invalid issue type ID").nullable().optional(),
    assigneeId: z.uuid("Invalid assignee ID").nullable().optional(),
    storyPoints: z
      .number()
      .int("Story points must be a whole number")
      .min(0, "Story points cannot be negative")
      .max(100, "Story points cannot exceed 100")
      .nullable()
      .optional(),
    labels: z.array(z.string().trim().min(1)).max(8).optional(),
  })
  .superRefine((data, ctx) => {
    const hasUpdateField = Object.values(data).some(
      (value) => value !== undefined,
    );

    if (!hasUpdateField) {
      ctx.addIssue({
        code: "custom",
        message: "Provide at least one field to update",
      });
    }
  });

export type TicketIdParams = z.infer<typeof ticketIdParamsSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
