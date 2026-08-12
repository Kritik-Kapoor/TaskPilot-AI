"use client";

import {
  isTicketDescriptionEmpty,
  normalizeTicketDescription,
} from "@/components/common/ticket-editor/ticketDescription";
import { useProject } from "@/providers/projectProvider";
import type { JSONContent } from "@tiptap/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createTicketComment,
  deleteTicket,
  getTicketById,
  getTicketComments,
  updateTicket,
  ticketQueryKey,
  commentsQueryKey,
} from "../api";
import type { TicketComment, UpdateTicketPayload } from "../types";
import {
  getProjectColumns,
  projectBoardQueryKey,
  projectColumnsQueryKey,
} from "../../board/api";
import { projectBacklogQueryKey } from "../../backlog/api";

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

  const columnsQuery = useQuery({
    queryKey: projectColumnsQueryKey(projectId),
    queryFn: () => getProjectColumns(projectId),
    enabled: Boolean(projectId),
  });

  const commentsQuery = useQuery({
    queryKey: commentsQueryKey(projectId, ticketId),
    queryFn: () => getTicketComments(projectId, ticketId),
    enabled: Boolean(projectId && ticketId),
  });

  const columns = useMemo(() => {
    if (columnsQuery.data?.columns.length) return columnsQuery.data.columns;
    if (ticketQuery.data?.column) return [ticketQuery.data.column];
    return [];
  }, [columnsQuery.data, ticketQuery.data]);

  const serverDescription = useMemo(
    () => normalizeTicketDescription(ticketQuery.data?.description),
    [ticketQuery.data?.description],
  );

  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] =
    useState<JSONContent | null>(null);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title = editedTitle ?? ticketQuery.data?.title ?? "";
  const description = editedDescription ?? serverDescription;

  const invalidateTicketLists = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: projectBoardQueryKey(projectId),
    });
    queryClient.invalidateQueries({
      queryKey: projectBacklogQueryKey(projectId),
    });
  }, [projectId, queryClient]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateTicketPayload) =>
      updateTicket(projectId, ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ticketQueryKey(projectId, ticketId),
      });
      invalidateTicketLists();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update ticket",
      );
    },
    onSettled: () => {
      setEditedTitle(null);
      setEditedDescription(null);
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
      setEditedTitle(nextTitle);

      if (!canEdit || !ticketQuery.data) return;

      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);

      titleDebounceRef.current = setTimeout(() => {
        const trimmed = nextTitle.trim();
        if (!trimmed || trimmed === ticketQuery.data.title) return;
        patchTicket({ title: trimmed });
      }, 600);
    },
    [canEdit, patchTicket, ticketQuery.data],
  );

  const handleDescriptionChange = useCallback(
    (nextDescription: JSONContent) => setEditedDescription(nextDescription),
    [],
  );

  const saveDescription = useCallback(() => {
    if (!canEdit || !ticketQuery.data || editedDescription === null) return;

    const payload = isTicketDescriptionEmpty(editedDescription)
      ? null
      : editedDescription;

    patchTicket({ description: payload });
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
      isDescriptionDirty: editedDescription !== null,
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
