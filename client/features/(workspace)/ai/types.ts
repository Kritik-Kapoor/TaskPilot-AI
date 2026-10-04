export type AiAction =
  | {
      type: "navigate_board";
      filters: {
        query?: string;
        assignee?: string[];
        priority?: string;
        type?: string;
        labels?: string[];
      };
    }
  | {
      type: "open_config";
      tab: "labels" | "statuses" | "types";
    }
  | {
      type: "create_issue_type";
      issueType: { id: string; key: string; color: string };
    }
  | {
      type: "create_ticket";
      ticket: {
        id: string;
        ticketKey: string;
        title: string;
        columnId: string;
      };
    }
  | {
      type: "assign_tickets";
      results: {
        assignee: { id: string; username: string };
        assigned: { ticketKey: string; title: string }[];
        reassigned: { ticketKey: string; title: string }[];
        skipped: { ticketKey: string; reason: string }[];
      }[];
      skipped: { ticketKey: string; reason: string }[];
    }
  | {
      type: "create_label";
      label: { id: string; name: string; color: string };
      alreadyExisted: boolean;
    }
  | {
      type: "apply_labels";
      labels: { id: string; name: string; created: boolean }[];
      labeled: { ticketKey: string; title: string }[];
      skipped: { ticketKey: string; reason: string }[];
    }
  | {
      type: "remove_labels";
      labels: string[];
      updated: { ticketKey: string; title: string }[];
      skipped: { ticketKey: string; reason: string }[];
    }
  | {
      type: "delete_label";
      label: { name: string; ticketsAffected: number };
    }
  | {
      type: "move_tickets";
      columnName: string;
      moved: { ticketKey: string; title: string }[];
      skipped: { ticketKey: string; reason: string }[];
    };

export type AiChatResponse = {
  message: string;
  actions: AiAction[];
};

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AiAction[];
};
