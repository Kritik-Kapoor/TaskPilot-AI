import type { ChatCompletionTool } from "openai/resources/chat/completions.js";

export const MAX_ASSIGNMENTS_PER_REQUEST = 10;
export const MAX_BATCH_CREATE_ITEMS = 10;

const ticketSelectorProperties = {
  ticketKeys: {
    type: "array",
    items: { type: "string" },
    description:
      "Explicit ticket keys, e.g. ['TB-104']. Use when the user names specific tickets.",
  },
  allTickets: {
    type: "boolean",
    description:
      "Set true to select every ticket in the project. Combine with withLabels or onlyUnassigned " +
      "when the user says 'all tickets', 'every ticket', or 'apply to all'.",
  },
  date: {
    type: "string",
    description:
      "YYYY-MM-DD. Selects tickets created on that day (user timezone).",
  },
  dateRange: {
    type: "object",
    properties: {
      from: {
        type: "string",
        description: "Start date, inclusive, YYYY-MM-DD.",
      },
      to: { type: "string", description: "End date, inclusive, YYYY-MM-DD." },
    },
    required: ["from", "to"],
    additionalProperties: false,
    description: "Selects tickets created in this date range (inclusive).",
  },
  withLabels: {
    type: "array",
    items: { type: "string" },
    description:
      "Only tickets that have ALL of these labels. Use for 'tickets with the frontend label'.",
  },
  onlyUnassigned: {
    type: "boolean",
    description:
      "Only tickets with no assignee. Use for 'all unassigned' or 'remaining unassigned tickets'.",
  },
} as const;

export const WORKSPACE_PAGES = [
  "board",
  "backlog",
  "inbox",
  "assistant",
  "members",
  "settings",
] as const;

export const aiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "navigate_workspace",
      description:
        "Navigate the user to a main workspace page. Use when they ask to go to, open, or be taken to " +
        "Backlog, Inbox, Assistant/AI chat, Members, Settings, or the Board (without ticket filters). " +
        "Examples: 'take me to backlog', 'open members page', 'where is settings'. " +
        "Do NOT use this to filter tickets — use filter_board when they want to find or show specific tickets.",
      parameters: {
        type: "object",
        properties: {
          page: {
            type: "string",
            enum: [...WORKSPACE_PAGES],
            description:
              "Target page: board, backlog, inbox, assistant (AI chat), members, or settings.",
          },
        },
        required: ["page"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_board",
      description:
        "Apply filters on the project board and navigate the user to the board page. " +
        "Use this whenever the user asks to see, show, filter, or find tickets. " +
        "All filter fields are optional — only include the ones the user mentions.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Free-text search on ticket title or key.",
          },
          assignees: {
            type: "array",
            items: { type: "string" },
            description:
              "Filter by one or more assignees. Each entry must be one of: " +
              "'current_user' when the user means themselves (me, my tickets); " +
              "'unassigned' for tickets with no assignee; " +
              "or a project member's email address (e.g. john@company.com) when filtering by another user. " +
              "The user may combine several, e.g. themselves plus one or more emails — include one entry per person. " +
              "Never put a person's name or username in this array — if a name is given without an email, " +
              "do not call this tool at all; ask the user to provide that person's email address instead.",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description: "Filter by ticket priority.",
          },
          type: {
            type: "string",
            description:
              "Issue type key to filter by (e.g. 'bug', 'story'). " +
              "This should be the lowercase key, not an ID.",
          },
          labels: {
            type: "array",
            items: { type: "string" },
            description:
              "Label names to filter by (e.g. ['frontend', 'bug']). " +
              "These are label names, not IDs — the server will resolve them.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_issue_type",
      description:
        "Create one or more issue types for the current project. " +
        "Use when the user asks to add types like 'epic', 'spike', etc. " +
        "Pass every type in the issueTypes array (one object per type).",
      parameters: {
        type: "object",
        properties: {
          issueTypes: {
            type: "array",
            minItems: 1,
            maxItems: MAX_BATCH_CREATE_ITEMS,
            items: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                  description: "The name/key for the issue type (e.g. 'epic').",
                },
                color: {
                  type: "string",
                  description:
                    "Hex color (e.g. '#6366f1'). Pick one if not specified.",
                },
              },
              required: ["key", "color"],
              additionalProperties: false,
            },
            description:
              "All issue types to create in this call, e.g. [{ key: 'epic', color: '#6366f1' }, …].",
          },
        },
        required: ["issueTypes"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description:
        "Create a new ticket in the current project. " +
        "Use when the user asks to create, add, or make a new ticket.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Ticket title.",
          },
          assignee: {
            type: "string",
            description:
              "Optional. Who the new ticket should be assigned to: 'current_user' or a project member's email. " +
              "Use this when the user creates a ticket and immediately assigns it, e.g. " +
              "'create a website bug ticket and assign it to jane@company.com'.",
          },
          priority: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            description:
              "Ticket priority. Defaults to MEDIUM if not specified.",
          },
          type: {
            type: "string",
            description: "Issue type key (e.g. 'bug', 'story'). Optional.",
          },
          columnName: {
            type: "string",
            description:
              "Board column name for this project (e.g. 'Todo', 'In Progress'). " +
              "Must match an existing column on the board. Defaults to 'Todo'.",
          },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_label",
      description:
        "Create one or more labels in the current project. " +
        "Use when the user asks to add or create labels. If they also want labels on tickets, " +
        "call this first and then call apply_labels.",
      parameters: {
        type: "object",
        properties: {
          labels: {
            type: "array",
            minItems: 1,
            maxItems: MAX_BATCH_CREATE_ITEMS,
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "Label name (e.g. 'frontend'). Stored lowercase.",
                },
                color: {
                  type: "string",
                  description:
                    "Hex color (e.g. '#6366f1'). Pick one if not specified.",
                },
              },
              required: ["name"],
              additionalProperties: false,
            },
            description:
              "Every label to create in this call, e.g. [{ name: 'frontend' }, { name: 'backend' }].",
          },
        },
        required: ["labels"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_board_columns",
      description:
        "Create one or more board columns (statuses/stages) on the project board. " +
        "Use when the user asks to add columns like 'QA', 'Staging', or multiple stages at once. " +
        "Columns are appended at the end of the board.",
      parameters: {
        type: "object",
        properties: {
          columns: {
            type: "array",
            minItems: 1,
            maxItems: MAX_BATCH_CREATE_ITEMS,
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "Column name as shown on the board (e.g. 'QA', 'In Review').",
                },
                color: {
                  type: "string",
                  description:
                    "Hex color (e.g. '#6366f1'). Pick one if not specified.",
                },
              },
              required: ["name"],
              additionalProperties: false,
            },
            description:
              "All columns to create, e.g. [{ name: 'QA' }, { name: 'Staging' }].",
          },
        },
        required: ["columns"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_board_columns",
      description:
        "Delete one or more board columns (statuses/stages) from the project. " +
        "Use when the user asks to remove or delete a column like Done, In Progress, or QA — " +
        "NOT for labels (use delete_project_label only for tag/label definitions). " +
        "The Backlog column cannot be deleted. If a column still has tickets, ticketDisposition and " +
        "(when moving) moveToColumnName are required — ask the user first if they did not say.",
      parameters: {
        type: "object",
        properties: {
          columns: {
            type: "array",
            minItems: 1,
            maxItems: MAX_BATCH_CREATE_ITEMS,
            items: {
              type: "object",
              properties: {
                columnName: {
                  type: "string",
                  description:
                    "Board column name to delete, e.g. 'Done', 'In Progress'.",
                },
                ticketDisposition: {
                  type: "string",
                  enum: ["move", "delete_all"],
                  description:
                    "Required when the column has tickets. 'move' sends tickets elsewhere; " +
                    "'delete_all' deletes those tickets with the column.",
                },
                moveToColumnName: {
                  type: "string",
                  description:
                    "Required when ticketDisposition is 'move'. Column that should receive the tickets.",
                },
              },
              required: ["columnName"],
              additionalProperties: false,
            },
          },
        },
        required: ["columns"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_board_column",
      description:
        "Delete one board column (stage/status) by name. " +
        "Use for requests like 'delete the Done column', 'remove In Progress stage'. " +
        "Never use delete_project_label for this. Backlog cannot be deleted.",
      parameters: {
        type: "object",
        properties: {
          columnName: {
            type: "string",
            description: "Board column to delete, e.g. 'Done', 'Todo', 'In Progress'.",
          },
          ticketDisposition: {
            type: "string",
            enum: ["move", "delete_all"],
            description:
              "Required when that column still has tickets — ask the user if unclear.",
          },
          moveToColumnName: {
            type: "string",
            description:
              "Required when ticketDisposition is 'move'. Target column for those tickets.",
          },
        },
        required: ["columnName"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_labels",
      description:
        "Add one or more labels to tickets. Creates a label if it does not already exist. " +
        "Use when the user asks to add, attach, or tag tickets with labels (including 'apply X to all tickets'). " +
        "Existing labels on those tickets are kept.",
      parameters: {
        type: "object",
        properties: {
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Label names to add, e.g. ['frontend'].",
          },
          ...ticketSelectorProperties,
        },
        required: ["labels"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_labels",
      description:
        "Remove one or more labels from tickets without deleting the label from the project. " +
        "Use when the user asks to remove, untag, or strip labels from tickets (including from all tickets).",
      parameters: {
        type: "object",
        properties: {
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Label names to remove from the selected tickets.",
          },
          ...ticketSelectorProperties,
        },
        required: ["labels"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project_label",
      description:
        "Delete a label (tag) from the project — e.g. 'frontend', 'bug'. " +
        "NOT for board columns/stages (Done, Todo, In Progress): use delete_board_column instead.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Label/tag name only, e.g. frontend or backend.",
          },
        },
        required: ["name"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_tickets",
      description:
        "Move tickets to a board column. The column must already exist on this project's board. " +
        "Tickets are placed at the bottom of the target column. " +
        "Use when the user asks to move tickets to In Progress, Done, or any other column.",
      parameters: {
        type: "object",
        properties: {
          columnName: {
            type: "string",
            description:
              "Target column name as shown on the board (e.g. 'In Progress', 'Done').",
          },
          ...ticketSelectorProperties,
        },
        required: ["columnName"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_tickets",
      description:
        "Assign or re-assign tickets to one or more project members. " +
        "Use this for ANY request to assign, re-assign, take, or give tickets to someone. " +
        "The server determines per-ticket whether it's an assign or re-assign. " +
        "Pass one entry in 'assignments' per person. " +
        "Each entry needs a ticket scope (ticketKeys, allTickets, date, or dateRange) and may combine " +
        "withLabels or onlyUnassigned — e.g. all unassigned tickets to me, or all tickets with label frontend to a@x.com.",
      parameters: {
        type: "object",
        properties: {
          assignments: {
            type: "array",
            minItems: 1,
            maxItems: MAX_ASSIGNMENTS_PER_REQUEST,
            description:
              "One entry per assignee, each with the tickets that person should end up with.",
            items: {
              type: "object",
              properties: {
                assignee: {
                  type: "string",
                  description:
                    "Who the ticket(s) should end up assigned to: 'current_user' when the user means " +
                    "themselves (assign/give me this ticket), or a project member's email address. " +
                    "Never put a bare name here. If a name is given without an email, do not call " +
                    "this tool; ask for that person's email instead.",
                },
                ...ticketSelectorProperties,
              },
              required: ["assignee"],
              additionalProperties: false,
            },
          },
        },
        required: ["assignments"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_configuration",
      description:
        "Open the project configuration dialog on a specific tab. " +
        "Use when the user asks to open settings/configuration UI. " +
        "Do NOT use for remove/delete column requests — use delete_board_column instead.",
      parameters: {
        type: "object",
        properties: {
          tab: {
            type: "string",
            enum: ["labels", "statuses", "types"],
            description: "Which configuration tab to open.",
          },
        },
        required: ["tab"],
        additionalProperties: false,
      },
    },
  },
];
