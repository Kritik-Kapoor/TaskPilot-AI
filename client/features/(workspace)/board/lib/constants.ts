import type { TicketPriority, TicketType } from "../types";

export const BOARD_PRIORITIES: TicketPriority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export const BOARD_TYPES: TicketType[] = ["STORY", "BUG", "TASK", "EPIC"];

export const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-sky-600 dark:text-sky-400",
  HIGH: "text-amber-600 dark:text-amber-400",
  URGENT: "text-destructive",
};

export const TYPE_CLASS: Record<TicketType, string> = {
  STORY:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  BUG: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  TASK: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  EPIC: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
};
