type DocNode = {
  type?: string;
  text?: string;
  content?: DocNode[];
};

const isBlank = (node: DocNode): boolean =>
  node.type === "text"
    ? !node.text?.trim()
    : node.content
      ? node.content.every(isBlank)
      : node.type === "paragraph";

const trimDoc = (doc: DocNode): DocNode => {
  const blocks = doc.content ?? [];
  let start = 0;
  let end = blocks.length;

  while (start < end && isBlank(blocks[start]!)) start++;
  while (end > start && isBlank(blocks[end - 1]!)) end--;

  const kept = structuredClone(blocks.slice(start, end));
  const first = kept[0]?.content;
  const last = kept[kept.length - 1]?.content;

  if (first?.[0]?.type === "text") first[0].text = first[0].text?.trimStart();
  if (last?.at(-1)?.type === "text")
    last.at(-1)!.text = last.at(-1)!.text?.trimEnd();

  // ProseMirror rejects empty text nodes, so drop any we just emptied.
  for (const block of kept) {
    if (block.content) {
      block.content = block.content.filter((n) => n.type !== "text" || n.text);
    }
  }

  return { ...doc, content: kept };
};

export function normalizeStoredTicketDescription(description: unknown) {
  if (description === undefined || description === null) return description;

  const trimmed = trimDoc(description as DocNode);
  return trimmed.content?.length ? trimmed : null;
}
