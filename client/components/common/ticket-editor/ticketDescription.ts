import type { JSONContent } from "@tiptap/core";

export const EMPTY_TICKET_DESCRIPTION: JSONContent = {
  type: "doc",
  content: [],
};

export type TicketDescriptionContent = JSONContent | string;

export function normalizeTicketDescription(
  value: unknown,
): TicketDescriptionContent {
  if (value == null) return EMPTY_TICKET_DESCRIPTION;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return EMPTY_TICKET_DESCRIPTION;

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "type" in parsed &&
        (parsed as JSONContent).type === "doc"
      ) {
        return parsed as JSONContent;
      }
    } catch {
      // Legacy HTML stored as plain text / JSON string
    }

    return trimmed;
  }

  if (
    typeof value === "object" &&
    "type" in value &&
    (value as JSONContent).type === "doc"
  ) {
    return value as JSONContent;
  }

  return EMPTY_TICKET_DESCRIPTION;
}

export function getTicketDescriptionTextLength(
  doc: TicketDescriptionContent,
): number {
  if (typeof doc === "string") {
    return doc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  }

  return collectTicketDescriptionText(doc).trim().length;
}

export function isTicketDescriptionEmpty(
  doc: TicketDescriptionContent | null | undefined,
): boolean {
  if (!doc) return true;
  return getTicketDescriptionTextLength(doc) === 0;
}

function collectTicketDescriptionText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  if (node.type === "mention") {
    const label = node.attrs?.label ?? node.attrs?.id;
    return label ? `@${label}` : "";
  }

  if (!node.content?.length) {
    return "";
  }

  const parts = node.content.map(collectTicketDescriptionText);

  if (node.type === "doc" || node.type === "paragraph") {
    return parts.join("\n");
  }

  return parts.join("");
}
