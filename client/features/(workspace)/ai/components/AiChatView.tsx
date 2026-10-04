"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  Bot,
  ExternalLink,
  Loader2,
  Settings,
  Sparkles,
  SquareKanban,
  Tag,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAiChat } from "../AiChatProvider";
import type { AiAction, AiMessage } from "../types";

const SUGGESTIONS = [
  "Show tickets assigned to me",
  "Show high priority bugs",
  "Create a new bug ticket",
  "Add issue type epic",
] as const;

function ActionBadge({ action }: { action: AiAction }) {
  switch (action.type) {
    case "navigate_board":
      return (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand">
          <SquareKanban className="h-3 w-3" /> Board filters applied
        </span>
      );
    case "open_config":
      return (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600">
          <Settings className="h-3 w-3" /> Configuration opened
        </span>
      );
    case "create_issue_type":
      return (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600">
          <Tag className="h-3 w-3" /> Created: {action.issueType.key}
        </span>
      );
    case "create_ticket":
      return (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-600">
          <ExternalLink className="h-3 w-3" /> {action.ticket.ticketKey}
        </span>
      );
    case "assign_tickets": {
      const updated = action.results.filter(
        (r) => r.assigned.length + r.reassigned.length > 0,
      );
      const total = updated.reduce(
        (sum, r) => sum + r.assigned.length + r.reassigned.length,
        0,
      );
      const skipped =
        action.skipped.length +
        action.results.reduce((sum, r) => sum + r.skipped.length, 0);
      const names = [...new Set(updated.map((r) => r.assignee.username))];
      return (
        <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600">
          <UserCheck className="h-3 w-3" />
          {total > 0
            ? `${total} ticket${total > 1 ? "s" : ""} → ${names.join(", ")}`
            : "No tickets updated"}
          {skipped > 0 && ` (${skipped} skipped)`}
        </span>
      );
    }
  }
}

function ChatMessage({ msg }: { msg: AiMessage }) {
  const isUser = msg.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-brand/70 text-white">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[min(85%,42rem)] space-y-0.5 rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-md bg-brand text-white"
            : "rounded-tl-md border border-border bg-muted/40",
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.action && <ActionBadge action={msg.action} />}
      </div>
    </div>
  );
}

type AiChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
};

function AiChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Ask TaskPilot AI…",
  autoFocus,
  className,
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-background px-4 py-3 shadow-sm transition-shadow focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className="block w-full max-h-40 min-h-8 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="icon"
          disabled={!value.trim() || isLoading}
          onClick={onSubmit}
          className="h-8 w-8 shrink-0 rounded-lg bg-brand text-white hover:bg-brand/90"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

const AiChatView = () => {
  const { messages, isLoading, send } = useAiChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hasConversation = messages.length > 0 || isLoading;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    send(input);
    setInput("");
  };

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    send(text);
  };

  if (!hasConversation) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-8">
          <div className="space-y-3 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-brand/15 to-brand/5 text-brand">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                How can I help?
              </h1>
              <p className="text-sm text-muted-foreground">
                Filter tickets, create issues, or manage project settings
              </p>
            </div>
          </div>

          <AiChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            autoFocus
          />

          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isLoading}
                onClick={() => handleSuggestion(suggestion)}
                className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-brand/70 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl">
          <AiChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default AiChatView;
