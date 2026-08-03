"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { useProject } from "@/providers/projectProvider";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createTicket } from "../board/api";
import {
  EMPTY_TICKET_DESCRIPTION,
  getTicketDescriptionTextLength,
  isTicketDescriptionEmpty,
} from "@/components/common/ticket-editor/ticketDescription";
import type { JSONContent } from "@tiptap/core";
import {
  isUuid,
  type Ticket,
  type TicketPriority,
  type TicketType,
} from "../board/types";

const ticketTypeSchema = z.enum(["STORY", "BUG", "TASK", "EPIC"]);
const ticketPrioritySchema = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]);

const ticketDescriptionSchema = z.custom<JSONContent>(
  (value) =>
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as JSONContent).type === "doc",
  { message: "Invalid description format" },
);

export const createTicketFormSchema = z.object({
  type: ticketTypeSchema,
  priority: ticketPrioritySchema,
  title: z
    .string()
    .trim()
    .min(1, { message: "Title is required" })
    .max(140, { message: "Title must be 140 characters or less" }),
  description: ticketDescriptionSchema.superRefine((value, ctx) => {
    if (getTicketDescriptionTextLength(value) > 2000) {
      ctx.addIssue({
        code: "custom",
        message: "Description must be 2000 characters or less",
      });
    }
  }),
  assigneeId: z.string(),
  storyPoints: z.string().superRefine((value, ctx) => {
    if (!value.trim()) return;

    const points = Number(value);
    if (!Number.isInteger(points) || points < 0 || points > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a whole number between 0 and 100",
      });
    }
  }),
  labels: z.array(z.string()).max(8),
});

type UseCreateTicketOptions = {
  /**
   * Resolved column UUID to create the ticket in. Callers are responsible
   * for resolving this from their own fetched data (board columns / backlog column).
   */
  columnId: string;
  /** Called on success so callers can update their own cache optimistically. */
  onCreated: (ticket: Ticket) => void;
  /** Called when the mutation settles so callers can invalidate their queries. */
  onSettled?: () => void;
};

const useCreateTicket = ({
  columnId,
  onCreated,
  onSettled,
}: UseCreateTicketOptions) => {
  const { activeProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);

  // mutation is defined before form intentionally — the onSuccess closure
  // captures `form` by reference; by the time onSuccess fires all hooks
  // have already run so `form` is assigned.
  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTicket>[0]) =>
      createTicket(payload),

    onSuccess: (ticket: Ticket) => {
      toast.success(`Created ${ticket.ticketKey}`, {
        description: ticket.title,
      });
      setIsOpen(false);
      form.reset();
      onCreated(ticket);
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create ticket",
      );
    },

    onSettled,
  });

  const form = useAppForm({
    defaultValues: {
      type: "TASK" as TicketType,
      priority: "MEDIUM" as TicketPriority,
      title: "",
      description: EMPTY_TICKET_DESCRIPTION,
      assigneeId: "unassigned",
      storyPoints: "",
      labels: [] as string[],
    },
    validators: {
      onSubmit: createTicketFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!activeProject) {
        toast.error("Select a project first");
        return;
      }

      if (!columnId) {
        toast.error("Target column is not available yet");
        return;
      }

      const assigneeId =
        value.assigneeId === "unassigned"
          ? null
          : isUuid(value.assigneeId)
            ? value.assigneeId
            : null;

      const description = isTicketDescriptionEmpty(value.description)
        ? undefined
        : value.description;

      await mutation.mutateAsync({
        projectId: activeProject.id,
        columnId,
        title: value.title.trim(),
        ...(description && { description }),
        priority: value.priority,
        type: value.type,
        assigneeId,
        storyPoints: value.storyPoints.trim()
          ? Number(value.storyPoints)
          : null,
        labels: value.labels,
      });
    },
  });

  const open = useCallback(() => {
    form.reset();
    setIsOpen(true);
  }, [form]);

  const close = useCallback(() => {
    setIsOpen(false);
    form.reset();
  }, [form]);

  return {
    form,
    isOpen,
    isSubmitting: mutation.isPending,
    open,
    close,
  };
};

export type CreateTicketFormType = ReturnType<typeof useCreateTicket>["form"];

export default useCreateTicket;
