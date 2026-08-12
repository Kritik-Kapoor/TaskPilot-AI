import type { TicketPriority } from "../types";

export const BOARD_PRIORITIES: TicketPriority[] = [
  "URGENT",
  "HIGH",
  "MEDIUM",
  "LOW",
];

export const PRIORITY_CLASS: Record<TicketPriority, string> = {
  LOW: "text-muted-foreground",
  MEDIUM: "text-sky-600 dark:text-sky-400",
  HIGH: "text-amber-600 dark:text-amber-400",
  URGENT: "text-destructive",
};
