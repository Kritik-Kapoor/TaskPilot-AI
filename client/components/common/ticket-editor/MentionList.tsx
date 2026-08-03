"use client";

import { cn } from "@/lib/utils";
import { getColor, initialsOf } from "@/lib/utils/common";
import type { ProjectMember } from "@/features/(workspace)/types";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export type MentionMemberItem = Pick<ProjectMember, "id" | "username">;

export type MentionListRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
};

type MentionListProps = {
  items: MentionMemberItem[];
  command: (item: { id: string; label: string }) => void;
};

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (!item) return;

      command({ id: item.id, label: item.username });
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!items.length) return false;

        if (event.key === "ArrowUp") {
          setSelectedIndex(
            (current) => (current + items.length - 1) % items.length,
          );
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((current) => (current + 1) % items.length);
          return true;
        }

        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (!items.length) {
      return (
        <div
          className="react-renderer w-52 rounded-lg border border-border bg-popover px-3 py-2.5 text-xs text-muted-foreground shadow-md"
          role="listbox"
          aria-label="Mention suggestions"
        >
          No members found
        </div>
      );
    }

    return (
      <div
        className="react-renderer w-52 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-md"
        role="listbox"
        aria-label="Mention suggestions"
        onMouseDown={(event) => {
          // Prevent editor blur before click/selection completes
          event.preventDefault();
        }}
      >
        <ul className="max-h-48 overflow-y-auto">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectItem(index);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-input/50 text-accent-foreground"
                      : "text-foreground hover:bg-muted/70",
                  )}
                >
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                    style={{ background: getColor(item.username) }}
                    aria-hidden
                  >
                    {initialsOf(item.username)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.username}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
);

MentionList.displayName = "MentionList";

export default MentionList;
