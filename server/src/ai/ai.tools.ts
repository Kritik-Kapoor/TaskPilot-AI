import type { ChatCompletionTool } from "openai/resources/chat/completions.js";

export const aiTools: ChatCompletionTool[] = [
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
        "Create a new issue type for the current project. " +
        "Use when the user asks to add a new type like 'epic', 'spike', etc.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The name/key for the new issue type (e.g. 'epic').",
          },
          color: {
            type: "string",
            description:
              "Hex color for the issue type (e.g. '#6366f1'). " +
              "Pick a reasonable color if the user doesn't specify one.",
          },
        },
        required: ["key", "color"],
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
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description:
              "Which column to place the ticket in. Defaults to 'todo'.",
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
      name: "assign_tickets",
      description:
        "Assign or re-assign one or more tickets to a project member. " +
        "Use this for ANY request to assign, re-assign, take, or give a ticket to someone " +
        "the server determines per-ticket whether it's an assign (currently unassigned) or a " +
        "re-assign (already has an assignee) based on each ticket's current state, so never " +
        "guess which one applies yourself. " +
        "Provide exactly ONE way to select tickets: ticketKeys, date, or dateRange.",
      parameters: {
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
          ticketKeys: {
            type: "array",
            items: { type: "string" },
            description:
              "Explicit ticket keys to assign/re-assign, e.g. ['TB-101', 'TB-102']. " +
              "Use this when the user names specific tickets.",
          },
          date: {
            type: "string",
            description:
              "A single date in YYYY-MM-DD format. Selects all tickets created on that date. " +
              "Use this when the user gives one specific day.",
          },
          dateRange: {
            type: "object",
            properties: {
              from: {
                type: "string",
                description: "Start date, inclusive, YYYY-MM-DD.",
              },
              to: {
                type: "string",
                description: "End date, inclusive, YYYY-MM-DD.",
              },
            },
            required: ["from", "to"],
            additionalProperties: false,
            description:
              "A date range. Selects all tickets created within this range (inclusive). " +
              "Use this when the user gives a span of days worth of tickets.",
          },
        },
        required: ["assignee"],
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
        "Use when the user asks to see or manage labels, statuses, or issue types settings.",
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
