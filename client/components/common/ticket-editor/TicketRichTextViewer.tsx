"use client";

import {
  normalizeTicketDescription,
  type TicketDescriptionContent,
} from "@/components/common/ticket-editor/ticketDescription";
import { cn } from "@/lib/utils";
import Mention from "@tiptap/extension-mention";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo } from "react";

type TicketRichTextViewerProps = {
  content: TicketDescriptionContent;
  className?: string;
};

export function TicketRichTextViewer({
  content,
  className,
}: TicketRichTextViewerProps) {
  const normalized = useMemo(
    () => normalizeTicketDescription(content),
    [content],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        code: {
          HTMLAttributes: {
            class: "ticket-editor-inline-code",
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: "ticket-editor-code-block",
          },
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "mention rounded bg-primary/10 px-1 font-medium text-primary",
        },
        renderText({ node }) {
          return `@${node.attrs.label ?? node.attrs.id}`;
        },
      }),
    ],
    [],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      editable: false,
      extensions,
      content: normalized,
      editorProps: {
        attributes: {
          class: cn(
            "text-sm leading-relaxed text-foreground/90",
            "[&_p]:mb-2 [&_p:last-child]:mb-0",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
            className,
          ),
        },
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(normalized, { emitUpdate: false });
  }, [editor, normalized]);

  if (!editor) return null;

  return (
    <EditorContent editor={editor} className="ticket-editor mt-2 border-none" />
  );
}
