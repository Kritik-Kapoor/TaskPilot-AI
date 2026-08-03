"use client";

import {
  isTicketDescriptionEmpty,
  normalizeTicketDescription,
} from "@/components/common/ticket-editor/ticketDescription";
import { useProject } from "@/providers/projectProvider";
import type { JSONContent } from "@tiptap/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createTicketComment,
  deleteTicket,
  getTicketById,
  getTicketComments,
  updateTicket,
} from "../api";
import type { TicketComment, UpdateTicketPayload } from "../types";
import { getProjectBoard } from "../../board/api";

const ticketQueryKey = (projectId: string, ticketId: string) =>
  ["ticket", projectId, ticketId] as const;

const commentsQueryKey = (projectId: string, ticketId: string) =>
  ["ticket-comments", projectId, ticketId] as const;

const useTicketDetails = (ticketId: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    activeProject,
    projectMembers,
    projectLabels,
    projectRole,
    buildWorkspacePath,
    isLabelsLoading,
  } = useProject();

  const projectId = activeProject?.id ?? "";
  const canEdit = projectRole !== "VIEWER";

  const ticketQuery = useQuery({
    queryKey: ticketQueryKey(projectId, ticketId),
    queryFn: () => getTicketById(projectId, ticketId),
    enabled: Boolean(projectId && ticketId),
  });

  const boardQuery = useQuery({
    queryKey: ["board", projectId],
    queryFn: () => getProjectBoard(projectId),
    enabled: Boolean(projectId),
  });

  const commentsQuery = useQuery({
    queryKey: commentsQueryKey(projectId, ticketId),
    queryFn: () => getTicketComments(projectId, ticketId),
    enabled: Boolean(projectId && ticketId),
  });

  const columns = useMemo(() => {
    const fromBoard =
      boardQuery.data?.columns.map((column) => ({
        id: column.id,
        name: column.name,
        color: column.color,
        position: column.position,
      })) ?? [];

    if (fromBoard.length > 0) return fromBoard;
    if (ticketQuery.data?.column) return [ticketQuery.data.column];
    return [];
  }, [boardQuery.data, ticketQuery.data]);

  const serverDescription = useMemo(
    () => normalizeTicketDescription(ticketQuery.data?.description),
    [ticketQuery.data?.description],
  );

  const [title, setTitle] = useState("");
  const [editedDescription, setEditedDescription] =
    useState<JSONContent | null>(null);
  const [isDescriptionDirty, setIsDescriptionDirty] = useState(false);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const description =
    isDescriptionDirty && editedDescription !== null
      ? editedDescription
      : serverDescription;

  useEffect(() => {
    if (!ticketQuery.data) return;

    setTitle(ticketQuery.data.title);
    setEditedDescription(null);
    setIsDescriptionDirty(false);
  }, [ticketQuery.data]);

  const invalidateTicketLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["board", projectId] });
    queryClient.invalidateQueries({
      queryKey: ["project-backlog", projectId],
    });
  }, [projectId, queryClient]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTicketPayload) =>
      updateTicket(projectId, ticketId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ticketQueryKey(projectId, ticketId),
      });
      invalidateTicketLists();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTicket(projectId, ticketId),
    onSuccess: () => {
      toast.success("Ticket deleted");
      invalidateTicketLists();
      router.push(buildWorkspacePath("/board"));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete ticket",
      );
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: JSONContent) =>
      createTicketComment(projectId, ticketId, content),
    onSuccess: (comment) => {
      queryClient.setQueryData<TicketComment[]>(
        commentsQueryKey(projectId, ticketId),
        (current = []) => [...current, comment],
      );
      toast.success("Comment added");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to add comment",
      );
    },
  });

  const patchTicket = useCallback(
    (payload: UpdateTicketPayload) => {
      if (!canEdit) return;
      updateMutation.mutate(payload);
    },
    [canEdit, updateMutation],
  );

  const handleTitleChange = useCallback(
    (nextTitle: string) => {
      setTitle(nextTitle);

      if (!canEdit || !ticketQuery.data) return;

      if (titleDebounceRef.current) {
        clearTimeout(titleDebounceRef.current);
      }

      titleDebounceRef.current = setTimeout(() => {
        const trimmed = nextTitle.trim();
        if (!trimmed || trimmed === ticketQuery.data.title) return;
        patchTicket({ title: trimmed });
      }, 600);
    },
    [canEdit, patchTicket, ticketQuery.data],
  );

  const handleDescriptionChange = useCallback(
    (nextDescription: JSONContent) => {
      setEditedDescription(nextDescription);
      setIsDescriptionDirty(true);
    },
    [],
  );

  const saveDescription = useCallback(() => {
    if (!canEdit || !ticketQuery.data || editedDescription === null) return;

    const payload = isTicketDescriptionEmpty(editedDescription)
      ? null
      : editedDescription;

    patchTicket({ description: payload });
    setIsDescriptionDirty(false);
    setEditedDescription(null);
  }, [canEdit, editedDescription, patchTicket, ticketQuery.data]);

  return {
    state: {
      ticket: ticketQuery.data,
      activeProject,
      comments: commentsQuery.data ?? [],
      columns,
      members: projectMembers ?? [],
      labels: projectLabels,
      isLoading: ticketQuery.isPending,
      isCommentsLoading: commentsQuery.isPending,
      isLabelsLoading,
      isSaving: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isCommentSubmitting: commentMutation.isPending,
      canEdit,
      title,
      description,
      isDescriptionDirty,
    },
    actions: {
      buildWorkspacePath,
      handleTitleChange,
      handleDescriptionChange,
      saveDescription,
      patchTicket,
      deleteTicket: () => deleteMutation.mutate(),
      addComment: (content: JSONContent) => commentMutation.mutate(content),
    },
  };
};

export type TicketDetailsState = ReturnType<typeof useTicketDetails>["state"];
export type TicketDetailsActions = ReturnType<
  typeof useTicketDetails
>["actions"];

export default useTicketDetails;
