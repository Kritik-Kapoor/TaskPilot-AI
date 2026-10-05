import { Fragment, type ReactNode } from "react";

const INLINE_CODE_PATTERN = /(`[^`\n]+`)/g;
const BOLD_PATTERN = /\*\*([^*]+)\*\*/g;
const ITALIC_PATTERN = /\*([^*]+)\*/g;

type KeyGen = { next: () => number };

const createKeyGen = (): KeyGen => {
  let n = 0;
  return { next: () => n++ };
};

const parseBoldAndItalic = (text: string, keys: KeyGen): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  BOLD_PATTERN.lastIndex = 0;
  while ((match = BOLD_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...parseItalic(text.slice(lastIndex, match.index), keys));
    }
    nodes.push(<strong key={keys.next()}>{match[1]}</strong>);
    lastIndex = BOLD_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...parseItalic(text.slice(lastIndex), keys));
  }

  return nodes.length > 0 ? nodes : parseItalic(text, keys);
};

const parseItalic = (text: string, keys: KeyGen): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  ITALIC_PATTERN.lastIndex = 0;
  while ((match = ITALIC_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={keys.next()}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
    }
    nodes.push(<em key={keys.next()}>{match[1]}</em>);
    lastIndex = ITALIC_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={keys.next()}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes.length > 0 ? nodes : [text];
};

export function renderChatMessageContent(text: string): ReactNode[] {
  const keys = createKeyGen();
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  INLINE_CODE_PATTERN.lastIndex = 0;
  while ((match = INLINE_CODE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...parseBoldAndItalic(text.slice(lastIndex, match.index), keys),
      );
    }
    const code = match[0].slice(1, -1);
    nodes.push(
      <code
        key={keys.next()}
        className="rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]"
      >
        {code}
      </code>,
    );
    lastIndex = INLINE_CODE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...parseBoldAndItalic(text.slice(lastIndex), keys));
  }

  return nodes.length > 0 ? nodes : [text];
}
