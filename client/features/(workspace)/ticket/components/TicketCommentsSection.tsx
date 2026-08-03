"use client";

import { TicketEditor } from "@/components/common/TicketEditor";
import { Button } from "@/components/ui/button";
import {
  EMPTY_TICKET_DESCRIPTION,
  isTicketDescriptionEmpty,
} from "@/components/common/ticket-editor/ticketDescription";
import { TicketRichTextViewer } from "@/components/common/ticket-editor/TicketRichTextViewer";
import { getColor, initialsOf } from "@/lib/utils/common";
import type { JSONContent } from "@tiptap/core";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import type { TicketComment } from "../types";

type TicketCommentsSectionProps = {
  comments: TicketComment[];
  isLoading: boolean;
  canEdit: boolean;
  isSubmitting: boolean;
  onAddComment: (content: JSONContent) => void;
};

const formatCommentDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const TicketCommentsSection = ({
  comments,
  isLoading,
  canEdit,
  isSubmitting,
  onAddComment,
}: TicketCommentsSectionProps) => {
  const [draft, setDraft] = useState<JSONContent>(EMPTY_TICKET_DESCRIPTION);
  const [editorKey, setEditorKey] = useState(0);

  const handleSubmit = () => {
    if (isTicketDescriptionEmpty(draft)) return;

    onAddComment(draft);
    setDraft(EMPTY_TICKET_DESCRIPTION);
    setEditorKey((current) => current + 1);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          Comments
        </h2>
        <span className="text-xs text-muted-foreground">
          ({comments.length})
        </span>
      </div>

      {canEdit && (
        <div className="rounded-lg bg-muted/20">
          <TicketEditor
            key={editorKey}
            value={draft}
            onChange={setDraft}
            placeholder="Write a comment… Use @ to mention teammates."
            footer={
              <Button
                type="button"
                disabled={isTicketDescriptionEmpty(draft) || isSubmitting}
                onClick={handleSubmit}
                className="bg-gradient-brand text-brand-foreground shadow-elegant hover:opacity-95"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting…
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> <span>Comment</span>
                  </>
                )}
              </Button>
            }
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-lg bg-muted/60"
            />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border bg-card/60 p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: getColor(comment.user.username) }}
                >
                  {initialsOf(comment.user.username)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">
                      {comment.user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <TicketRichTextViewer content={comment.content} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TicketCommentsSection;
