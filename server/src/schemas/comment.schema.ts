import { z } from "zod";

export const ticketCommentParamsSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  ticketId: z.uuid("Invalid ticket ID"),
});

const commentContentSchema = z.looseObject({ type: z.literal("doc") });

export const createCommentSchema = z.object({
  content: commentContentSchema,
});

export type TicketCommentParams = z.infer<typeof ticketCommentParamsSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
