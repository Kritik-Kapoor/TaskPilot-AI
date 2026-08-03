"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProject } from "@/providers/projectProvider";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Code, Italic, List, SquareCode } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createMemberMentionSuggestion } from "@/components/common/ticket-editor/createMemberMentionSuggestion";
import type { MentionMemberItem } from "@/components/common/ticket-editor/MentionList";
import {
  toggleCodeBlockSafely,
  toggleInlineCodeSafely,
} from "@/components/common/ticket-editor/mentionSafeFormatting";

import type { JSONContent } from "@tiptap/core";
import {
  EMPTY_TICKET_DESCRIPTION,
  type TicketDescriptionContent,
} from "@/components/common/ticket-editor/ticketDescription";

type TicketEditorProps = {
  id?: string;
  value: TicketDescriptionContent;
  onChange: (value: JSONContent) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  members?: MentionMemberItem[];
  footer?: ReactNode;
  "aria-invalid"?: boolean;
};

export function TicketEditor({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Add context, acceptance criteria, links…",
  disabled = false,
  members: membersProp,
  footer,
  "aria-invalid": ariaInvalid,
}: TicketEditorProps) {
  const { projectMembers } = useProject();
  const [, setRevision] = useState(0);

  const members = useMemo(
    () =>
      membersProp ??
      projectMembers?.map((member) => ({
        id: member.id,
        username: member.username,
      })) ??
      [],
    [membersProp, projectMembers],
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
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention rounded bg-primary/10 px-1 font-medium text-primary",
        },
        renderText({ node }) {
          return `@${node.attrs.label ?? node.attrs.id}`;
        },
        renderHTML({ node }) {
          return [
            "span",
            {
              "data-type": "mention",
              "data-id": node.attrs.id,
              "data-label": node.attrs.label,
              class:
                "mention rounded bg-primary/10 px-1 font-medium text-primary",
            },
            `@${node.attrs.label ?? node.attrs.id}`,
          ];
        },
        suggestion: createMemberMentionSuggestion(members),
      }),
    ],
    [members, placeholder],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: value ?? EMPTY_TICKET_DESCRIPTION,
      editable: !disabled,
      onUpdate: ({ editor: currentEditor }) => {
        onChange(currentEditor.getJSON());
      },
      onBlur: () => {
        onBlur?.();
      },
      editorProps: {
        attributes: {
          ...(id ? { id } : {}),
          "aria-invalid": ariaInvalid ? "true" : "false",
          class: cn(
            "min-h-28 px-3 py-2 text-sm focus:outline-none",
            footer && "pb-12",
            "[&_p]:mb-2 [&_p:last-child]:mb-0",
            "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
            "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
            "[&_p.is-empty:first-child:before]:pointer-events-none [&_p.is-empty:first-child:before]:float-left [&_p.is-empty:first-child:before]:h-0 [&_p.is-empty:first-child:before]:text-muted-foreground [&_p.is-empty:first-child:before]:content-[attr(data-placeholder)]",
          ),
        },
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => setRevision((current) => current + 1);

    editor.on("selectionUpdate", updateToolbar);
    editor.on("transaction", updateToolbar);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("transaction", updateToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;

    const nextContent = value ?? EMPTY_TICKET_DESCRIPTION;

    if (typeof nextContent === "string") {
      editor.commands.setContent(nextContent, { emitUpdate: false });
      return;
    }

    const currentJson = editor.getJSON();

    if (JSON.stringify(currentJson) !== JSON.stringify(nextContent)) {
      editor.commands.setContent(nextContent, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-input bg-input/20 p-3 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ticket-editor overflow-hidden rounded-lg border border-input bg-input/20 ring-offset-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
        ariaInvalid && "border-destructive ring-destructive/20",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive("bold") && "bg-muted")}
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive("italic") && "bg-muted")}
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive("bulletList") && "bg-muted")}
        >
          <List />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Inline code"
          aria-pressed={editor.isActive("code")}
          onClick={() => toggleInlineCodeSafely(editor)}
          className={cn(editor.isActive("code") && "bg-muted")}
        >
          <Code />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Code block"
          aria-pressed={editor.isActive("codeBlock")}
          onClick={() => toggleCodeBlockSafely(editor)}
          className={cn(editor.isActive("codeBlock") && "bg-muted")}
        >
          <SquareCode />
        </Button>
      </div>
      <div className="relative">
        <EditorContent editor={editor} />
        {footer ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end p-2">
            <div className="pointer-events-auto">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
