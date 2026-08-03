import type { Editor } from "@tiptap/react";

export function selectionContainsMention(editor: Editor): boolean {
  const { from, to, empty } = editor.state.selection;
  if (empty) return false;

  let found = false;
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.type.name === "mention") {
      found = true;
    }
  });
  return found;
}

function blockContainsMention(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  let found = false;

  $from.parent.forEach((node) => {
    if (node.type.name === "mention") {
      found = true;
    }
  });

  return found;
}

export function toggleInlineCodeSafely(editor: Editor): boolean {
  if (selectionContainsMention(editor)) {
    return false;
  }

  return editor.chain().focus().toggleCode().run();
}

export function toggleCodeBlockSafely(editor: Editor): boolean {
  const { from, to, empty } = editor.state.selection;

  if (!empty) {
    if (selectionContainsMention(editor)) {
      return false;
    }

    const text = editor.state.doc.textBetween(from, to, "\n", "\n");

    return editor
      .chain()
      .focus()
      .insertContentAt(
        { from, to },
        {
          type: "codeBlock",
          content: text ? [{ type: "text", text }] : [],
        },
      )
      .run();
  }

  if (blockContainsMention(editor)) {
    return editor.chain().focus().splitBlock().toggleCodeBlock().run();
  }

  return editor.chain().focus().toggleCodeBlock().run();
}
