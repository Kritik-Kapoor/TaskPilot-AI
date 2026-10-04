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
    };

export type AiChatResponse = {
  message: string;
  action: AiAction | null;
};

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AiAction | null;
};
