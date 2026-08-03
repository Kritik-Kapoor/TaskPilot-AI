"use client";

import { useAppForm } from "@/components/common/form/hooks";
import { useEffect, useRef } from "react";
import { z } from "zod";
import type { TicketDetail } from "../../board/types";
import type { UpdateTicketPayload } from "../types";

const ticketTypeSchema = z.enum(["STORY", "BUG", "TASK", "EPIC"]);
const ticketPrioritySchema = z.enum(["URGENT", "HIGH", "MEDIUM", "LOW"]);

export const ticketDetailsSidebarSchema = z.object({
  columnId: z.string().uuid(),
  type: ticketTypeSchema,
  priority: ticketPrioritySchema,
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

export type TicketDetailsSidebarFormValues = z.infer<
  typeof ticketDetailsSidebarSchema
>;

export const getTicketSidebarFormValues = (
  ticket: TicketDetail,
): TicketDetailsSidebarFormValues => ({
  columnId: ticket.columnId,
  type: ticket.type,
  priority: ticket.priority,
  assigneeId: ticket.assigneeId ?? "unassigned",
  storyPoints: ticket.storyPoints != null ? String(ticket.storyPoints) : "",
  labels: ticket.labels.map((label) => label.id),
});

type UseTicketDetailsSidebarFormOptions = {
  ticket: TicketDetail;
  canEdit: boolean;
  onPatch: (payload: UpdateTicketPayload) => void;
};

const useTicketDetailsSidebarForm = ({
  ticket,
  canEdit,
  onPatch,
}: UseTicketDetailsSidebarFormOptions) => {
  const isSyncingRef = useRef(false);

  const form = useAppForm({
    defaultValues: getTicketSidebarFormValues(ticket),
    validators: {
      onChange: ticketDetailsSidebarSchema,
    },
  });

  useEffect(() => {
    isSyncingRef.current = true;
    form.reset(getTicketSidebarFormValues(ticket));
    queueMicrotask(() => {
      isSyncingRef.current = false;
    });
  }, [form, ticket.id, ticket.updatedAt]);

  const patchIfEditable = (payload: UpdateTicketPayload) => {
    if (!canEdit || isSyncingRef.current) return;
    onPatch(payload);
  };

  return { form, patchIfEditable, isSyncingRef };
};

export type TicketDetailsSidebarFormType = ReturnType<
  typeof useTicketDetailsSidebarForm
>["form"];

export default useTicketDetailsSidebarForm;
