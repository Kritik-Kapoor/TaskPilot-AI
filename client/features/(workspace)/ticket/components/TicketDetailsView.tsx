"use client";

import ConfirmationDialog from "@/components/common/dialogs/ConfirmationDialogl";
import { TicketEditor } from "@/components/common/TicketEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useTicketDetails from "../hooks/useTicketDetails";
import TicketCommentsSection from "./TicketCommentsSection";
import TicketDetailsHeader from "./TicketDetailsHeader";
import TicketDetailsSidebar from "./TicketDetailsSidebar";

type TicketDetailsViewProps = {
  ticketId: string;
};

const TicketDetailsView = ({ ticketId }: TicketDetailsViewProps) => {
  const {
    state: {
      ticket,
      activeProject,
      comments,
      columns,
      members,
      labels,
      isLoading,
      isCommentsLoading,
      isLabelsLoading,
      isSaving,
      isDeleting,
      isCommentSubmitting,
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
      deleteTicket,
      addComment,
    },
  } = useTicketDetails(ticketId);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-5 w-96" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <Skeleton className="h-130 w-full" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Ticket not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This ticket may have been deleted or you may not have access to it.
        </p>
        <Button asChild variant="outline">
          <Link href={buildWorkspacePath("/board")}>Back to board</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto pb-8">
        <TicketDetailsHeader
          ticket={ticket}
          project={activeProject}
          members={members}
          commentCount={comments.length}
          title={title}
          canEdit={canEdit}
          buildWorkspacePath={buildWorkspacePath}
          onTitleChange={handleTitleChange}
          onDelete={() => setIsDeleteOpen(true)}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase">
                Description
              </h2>

              <div className="rounded-lg bg-muted/20">
                <TicketEditor
                  key={`${ticket.id}-${ticket.updatedAt}`}
                  value={description}
                  onChange={handleDescriptionChange}
                  disabled={!canEdit}
                  placeholder="Add a richer description, @mention teammates, or drop in acceptance criteria…"
                  footer={
                    canEdit && isDescriptionDirty ? (
                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={saveDescription}
                        className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
                      >
                        {isSaving ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </span>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Save</span>
                          </>
                        )}
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            </section>

            <TicketCommentsSection
              comments={comments}
              isLoading={isCommentsLoading}
              canEdit={canEdit}
              isSubmitting={isCommentSubmitting}
              onAddComment={addComment}
            />
          </div>

          <TicketDetailsSidebar
            ticket={ticket}
            columns={columns}
            members={members}
            labels={labels}
            isLabelsLoading={isLabelsLoading}
            canEdit={canEdit}
            isSaving={isSaving}
            onPatch={patchTicket}
          />
        </div>
      </div>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        callbackFn={() => {
          deleteTicket();
          setIsDeleteOpen(false);
        }}
        title={`Delete ${ticket.ticketKey}?`}
        description="This will permanently delete the ticket and all of its comments."
        btnText="ticket"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TicketDetailsView;
