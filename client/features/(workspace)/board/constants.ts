import type { TicketStatus } from "@/features/(onboarding)/lib/mock-app";

export const BOARD_COLUMNS: TicketStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

export const BOARD_PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;

export const BOARD_TYPES = ["Story", "Bug", "Task", "Epic"] as const;
