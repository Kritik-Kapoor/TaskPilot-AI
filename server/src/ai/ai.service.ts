import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions.js";
import { openai } from "../config/openai.js";
import { aiTools } from "./ai.tools.js";
import {
  executeApplyLabels,
  executeAssignTickets,
  executeCreateBoardColumns,
  executeDeleteBoardColumns,
  executeCreateIssueTypes,
  executeCreateLabels,
  executeCreateTicket,
  executeDeleteLabel,
  executeFilterBoard,
  executeMoveTickets,
  executeNavigateWorkspace,
  executeOpenConfig,
  executeRemoveLabels,
} from "./ai.tool-executor.js";
import { AiChatError } from "./ai.errors.js";
import { ApiError } from "../utils/apiResponse.js";
import type { AiChatHistoryTurn } from "./aiChatHistory.service.js";
import type { AiAction, AiChatResponse } from "./ai.types.js";
import { formatTodayInTimeZone } from "../utils/assignmentDate.utils.js";

const MAX_TOOL_ROUNDS = 3;
const MAX_TOOL_CALLS = 8;

const buildSystemPrompt = (timeZone: string) => {
  const today = formatTodayInTimeZone(timeZone);

  return `You are TaskPilot AI. A helpful project management assistant embedded in a task tracking app.
Today's date in the user's timezone (${timeZone}) is ${today} (YYYY-MM-DD). Use this to resolve relative dates
like "today", "yesterday", or "last 3 days" into absolute YYYY-MM-DD values before calling a tool.

You can help users:
- Filter and find tickets on the board
- Create new tickets
- Create new issue types (several at once in one tool call)
- Create labels or board columns/stages (several at once in one tool call)
- Create, apply, remove, or delete labels on tickets
- Assign or re-assign tickets to project members (including bulk: all tickets, by label, by date, unassigned only)
- Move tickets to board columns
- Open configuration pages
- Navigate to workspace pages (backlog, inbox, assistant, members, settings)

When the user asks for several things in one message, call every matching tool in that same turn.
Independent tasks can be called together. Example:
"Create a label named frontend, add it to TB-104 and TB-105, create a website bug ticket and assign it to a@x.com"
→ create_label, apply_labels, and create_ticket (with assignee) in one turn.

If a later task needs a result you do not have yet (for example assigning a ticket that has not been created),
call the first tool now. You will get the ticket key back and can call the next tool after that.
Do not invent ticket keys for tickets you have not created.

When the user asks to go to a workspace area (backlog, inbox, assistant, members, settings, or board without filters),
use navigate_workspace. When the user asks to see or find tickets, use filter_board.
When the user asks to create a ticket, use create_ticket. If they also say who it should go to, pass "assignee".
When the user asks to add issue types, use create_issue_type with every type in issueTypes
(even a single type — use a one-item array). Same for create_label (labels array) and
create_board_columns (columns array) when they ask for board stages/statuses/columns.
delete_board_column when they ask to remove OR delete a board column/stage (e.g. "remove Done column", "delete Done column").
Never use open_configuration for remove/delete column requests — perform delete_board_column instead.
Do NOT use delete_project_label for column names like Done, Todo, or In Progress — those are board columns, not labels.
If they list several labels, types, or columns in one message, put them all in one tool call.
When the user asks to add or attach labels to tickets, use apply_labels (set allTickets: true for "all tickets").
When the user asks to remove labels from tickets, use remove_labels. When they ask to delete a label/tag from the project, use delete_label.
When deleting a board column that still has tickets, do NOT call delete_board_columns until the user chooses: move tickets (ticketDisposition "move" + moveToColumnName) or delete tickets with the column ("delete_all").
When the user asks to move tickets to a column/status, use move_tickets with the column name from the board.
When the user asks to assign, re-assign, take, or give a ticket to someone, use assign_tickets —
always use this single tool regardless of whether the ticket(s) are currently assigned or not;
the server figures out per-ticket whether it's an assign or a re-assign.
When the user asks to open or go to configuration/settings UI for labels/statuses/types, use open_configuration.
Do not use open_configuration as a substitute for deleting a column.

For assignee filters, pass an "assignees" array — one entry per person:
- "current_user" when they mean themselves (me, my tickets)
- "unassigned" for tickets with no assignee
- an email address for each other project member they mention
The user may combine these, e.g. "show tickets for me and jane@company.com" → assignees: ["current_user", "jane@company.com"].
If they refer to another person by name without an email, do NOT call filter_board at all — ask for that person's email instead.

For bulk ticket tools (apply_labels, remove_labels, move_tickets, assign_tickets entries), pick exactly ONE scope:
ticketKeys, allTickets: true, date, or dateRange. You may also set withLabels and/or onlyUnassigned to narrow the set.
Examples:
- "Apply frontend to all tickets" → apply_labels with labels: ["frontend"], allTickets: true.
- "Assign all unassigned tickets to me" → assign_tickets with assignee: "current_user", allTickets: true, onlyUnassigned: true.
- "Assign tickets with frontend label to me" → assign_tickets with withLabels: ["frontend"], allTickets: true, assignee: "current_user".
- "Move all frontend tickets to In Progress" → move_tickets with columnName: "In Progress", allTickets: true, withLabels: ["frontend"].

For assign_tickets, pass an "assignments" array with ONE entry per person. Never list the same ticket under two different people.
If a person is named without an email, do NOT call assign_tickets — ask for their email instead. If the user
doesn't say which tickets, ask them to clarify rather than guessing.

Keep text responses brief and friendly. Always use a tool when the user's intent matches one.
If you cannot determine the user's intent, ask a clarifying question, do NOT make assumptions.
After tools have finished, only call more tools if part of the user's request is still undone.

Examples:
- "Delete Done column" or "Remove Done column" → delete_board_column with columnName "Done".
- "Open column settings" → open_configuration tab statuses. Never delete_label for Done/Todo/In Progress.`;
};

type ProcessInput = {
  message: string;
  history: AiChatHistoryTurn[];
  userId: string;
  orgId: string;
  projectId: string;
  timeZone: string;
};

type ToolContext = {
  userId: string;
  orgId: string;
  projectId: string;
  timeZone: string;
};

type ToolOutcome = {
  actions: AiAction[];
  text: string;
  applied: number;
  skipped: number;
  failed: boolean;
  toolResult: unknown;
};

const isHandledToolError = (error: unknown) =>
  error instanceof AiChatError ||
  error instanceof ApiError ||
  error instanceof ApiError;

const formatAssignTicketsText = (
  action: Extract<AiAction, { type: "assign_tickets" }>,
) => {
  const parts: string[] = [];
  let applied = 0;
  let skipped = action.skipped.length;

  for (const result of action.results) {
    const name = result.assignee.username;

    if (result.assigned.length > 0) {
      applied += result.assigned.length;
      parts.push(
        `Assigned ${result.assigned.map((t) => t.ticketKey).join(", ")} to ${name}`,
      );
    }
    if (result.reassigned.length > 0) {
      applied += result.reassigned.length;
      parts.push(
        `Re-assigned ${result.reassigned.map((t) => t.ticketKey).join(", ")} to ${name}`,
      );
    }
    if (result.skipped.length > 0) {
      skipped += result.skipped.length;
      parts.push(
        `Skipped ${result.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
      );
    }
  }

  if (action.skipped.length > 0) {
    parts.push(
      `Skipped ${action.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
    );
  }

  return {
    text:
      parts.length > 0
        ? parts.join("; ")
        : "No matching tickets were found for that request",
    applied,
    skipped,
  };
};

const formatApplyLabelsText = (
  action: Extract<AiAction, { type: "apply_labels" }>,
) => {
  const names = action.labels.map((label) => label.name).join(", ");
  const parts: string[] = [];

  if (action.labeled.length > 0) {
    parts.push(
      `Added ${names} to ${action.labeled.map((t) => t.ticketKey).join(", ")}`,
    );
  }
  if (action.skipped.length > 0) {
    parts.push(
      `Skipped ${action.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
    );
  }

  return {
    text: parts.length > 0 ? parts.join("; ") : `No labels were added`,
    applied: action.labeled.length,
    skipped: action.skipped.length,
  };
};

async function executeOneTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolOutcome> {
  switch (name) {
    case "navigate_workspace": {
      const action = executeNavigateWorkspace(
        args as {
          page:
            | "board"
            | "backlog"
            | "inbox"
            | "assistant"
            | "members"
            | "settings";
        },
      );
      const pageLabels: Record<string, string> = {
        board: "Board",
        backlog: "Backlog",
        inbox: "Inbox",
        assistant: "Assistant",
        members: "Members",
        settings: "Settings",
      };
      return {
        actions: [action],
        text: `Opening ${pageLabels[action.page] ?? action.page}…`,
        applied: 1,
        skipped: 0,
        failed: false,
        toolResult: { ok: true, page: action.page },
      };
    }

    case "filter_board": {
      const action = (await executeFilterBoard(args as never, ctx)) as Extract<
        AiAction,
        { type: "navigate_board" }
      >;
      const requestedFilters: string[] = [];
      const typedArgs = args as {
        assignees?: string[];
        priority?: string;
        type?: string;
        labels?: string[];
        query?: string;
      };

      if (typedArgs.assignees?.length) {
        const assigneeLabels = typedArgs.assignees.map((a) => {
          if (a === "current_user") return "you";
          if (a === "unassigned") return "unassigned";
          return a;
        });
        requestedFilters.push(`assigned to ${assigneeLabels.join(", ")}`);
      }
      if (typedArgs.priority)
        requestedFilters.push(`${typedArgs.priority} priority`);
      if (typedArgs.type) requestedFilters.push(`type: ${typedArgs.type}`);
      if (typedArgs.labels?.length)
        requestedFilters.push(`labels: ${typedArgs.labels.join(", ")}`);
      if (typedArgs.query)
        requestedFilters.push(`matching "${typedArgs.query}"`);

      const text =
        requestedFilters.length > 0
          ? `Showing tickets ${requestedFilters.join(", ")}. Navigating to board…`
          : "Opening the board with all tickets.";

      return {
        actions: [action],
        text,
        applied: 1,
        skipped: 0,
        failed: false,
        toolResult: { ok: true, type: action.type, filters: action.filters },
      };
    }

    case "create_issue_type": {
      const { actions, errors } = await executeCreateIssueTypes(
        args as never,
        ctx,
      );
      const parts = actions.map(
        (action) => `Created issue type "${action.issueType.key}"`,
      );
      if (errors.length > 0) parts.push(...errors);

      return {
        actions,
        text:
          parts.length > 0 ? parts.join("; ") : "No issue types were created",
        applied: actions.length,
        skipped: errors.length,
        failed: errors.length > 0 && actions.length === 0,
        toolResult: {
          ok: actions.length > 0,
          issueTypes: actions.map((action) => action.issueType),
          errors,
        },
      };
    }

    case "create_ticket": {
      const { action, assignment } = await executeCreateTicket(
        args as never,
        ctx,
      );
      const actions: AiAction[] = [action];
      let text = `Created ticket ${action.ticket.ticketKey}: "${action.ticket.title}"`;
      let applied = 1;
      let skipped = 0;

      if (assignment) {
        actions.push(assignment);
        const assignText = formatAssignTicketsText(assignment);
        if (assignText.text) text += `. ${assignText.text}`;
        applied += assignText.applied;
        skipped += assignText.skipped;
      }

      return {
        actions,
        text,
        applied,
        skipped,
        failed: false,
        toolResult: {
          ok: true,
          ticketKey: action.ticket.ticketKey,
          title: action.ticket.title,
        },
      };
    }

    case "create_label": {
      const { actions, errors } = await executeCreateLabels(args as never, ctx);
      const parts = actions.map((action) =>
        action.alreadyExisted
          ? `Label "${action.label.name}" already exists`
          : `Created label "${action.label.name}"`,
      );
      if (errors.length > 0) parts.push(...errors);

      const applied = actions.filter((action) => !action.alreadyExisted).length;

      return {
        actions,
        text: parts.length > 0 ? parts.join("; ") : "No labels were created",
        applied,
        skipped: errors.length,
        failed: errors.length > 0 && actions.length === 0,
        toolResult: {
          ok: actions.length > 0,
          labels: actions.map((action) => ({
            name: action.label.name,
            alreadyExisted: action.alreadyExisted,
          })),
          errors,
        },
      };
    }

    case "delete_board_column":
    case "delete_board_columns": {
      const { actions, errors } = await executeDeleteBoardColumns(
        args as never,
        ctx,
      );
      const parts = actions.map((action) => {
        const base = `Deleted column "${action.column.name}"`;
        if (action.ticketsAffected > 0) {
          return `${base} (${action.ticketsAffected} ticket${action.ticketsAffected === 1 ? "" : "s"} handled)`;
        }
        return base;
      });
      if (errors.length > 0) parts.push(...errors);

      return {
        actions,
        text: parts.length > 0 ? parts.join("; ") : "No columns were deleted",
        applied: actions.length,
        skipped: errors.length,
        failed: errors.length > 0 && actions.length === 0,
        toolResult: {
          ok: actions.length > 0,
          deleted: actions.map((a) => a.column.name),
          errors,
        },
      };
    }

    case "create_board_columns": {
      const { actions, errors } = await executeCreateBoardColumns(
        args as never,
        ctx,
      );
      const parts = actions.map((action) =>
        action.alreadyExisted
          ? `Column "${action.column.name}" already exists`
          : `Created column "${action.column.name}"`,
      );
      if (errors.length > 0) parts.push(...errors);

      const applied = actions.filter((action) => !action.alreadyExisted).length;

      return {
        actions,
        text: parts.length > 0 ? parts.join("; ") : "No columns were created",
        applied,
        skipped: errors.length,
        failed: errors.length > 0 && actions.length === 0,
        toolResult: {
          ok: actions.length > 0,
          columns: actions.map((action) => ({
            name: action.column.name,
            alreadyExisted: action.alreadyExisted,
          })),
          errors,
        },
      };
    }

    case "apply_labels": {
      const action = (await executeApplyLabels(args as never, ctx)) as Extract<
        AiAction,
        { type: "apply_labels" }
      >;
      const formatted = formatApplyLabelsText(action);
      return {
        actions: [action],
        text: formatted.text,
        applied: formatted.applied,
        skipped: formatted.skipped,
        failed: false,
        toolResult: {
          ok: true,
          labels: action.labels,
          labeled: action.labeled,
          skipped: action.skipped,
        },
      };
    }

    case "remove_labels": {
      const action = (await executeRemoveLabels(args as never, ctx)) as Extract<
        AiAction,
        { type: "remove_labels" }
      >;
      const parts: string[] = [];
      if (action.updated.length > 0) {
        parts.push(
          `Removed ${action.labels.join(", ")} from ${action.updated.map((t) => t.ticketKey).join(", ")}`,
        );
      }
      if (action.skipped.length > 0) {
        parts.push(
          `Skipped ${action.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
        );
      }
      return {
        actions: [action],
        text: parts.length > 0 ? parts.join("; ") : "No labels were removed",
        applied: action.updated.length,
        skipped: action.skipped.length,
        failed: false,
        toolResult: { ok: true, ...action },
      };
    }

    case "delete_label": {
      const action = (await executeDeleteLabel(args as never, ctx)) as Extract<
        AiAction,
        { type: "delete_label" }
      >;
      return {
        actions: [action],
        text: `Deleted label "${action.label.name}" (removed from ${action.label.ticketsAffected} ticket${action.label.ticketsAffected === 1 ? "" : "s"})`,
        applied: 1,
        skipped: 0,
        failed: false,
        toolResult: { ok: true, label: action.label },
      };
    }

    case "move_tickets": {
      const action = (await executeMoveTickets(args as never, ctx)) as Extract<
        AiAction,
        { type: "move_tickets" }
      >;
      const parts: string[] = [];
      if (action.moved.length > 0) {
        parts.push(
          `Moved ${action.moved.map((t) => t.ticketKey).join(", ")} to ${action.columnName}`,
        );
      }
      if (action.skipped.length > 0) {
        parts.push(
          `Skipped ${action.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
        );
      }
      return {
        actions: [action],
        text: parts.length > 0 ? parts.join("; ") : "No tickets were moved",
        applied: action.moved.length,
        skipped: action.skipped.length,
        failed: false,
        toolResult: { ok: true, ...action },
      };
    }

    case "assign_tickets": {
      const action = (await executeAssignTickets(
        args as never,
        ctx,
      )) as Extract<AiAction, { type: "assign_tickets" }>;
      const formatted = formatAssignTicketsText(action);
      return {
        actions: [action],
        text: formatted.text,
        applied: formatted.applied,
        skipped: formatted.skipped,
        failed: false,
        toolResult: {
          ok: true,
          results: action.results,
          skipped: action.skipped,
        },
      };
    }

    case "open_configuration": {
      const action = executeOpenConfig(args as never);
      const tabNames = {
        labels: "Labels",
        statuses: "Statuses",
        types: "Issue Types",
      };
      return {
        actions: [action],
        text: `Opening ${tabNames[args.tab as keyof typeof tabNames]} configuration…`,
        applied: 1,
        skipped: 0,
        failed: false,
        toolResult: { ok: true, tab: args.tab },
      };
    }

    default:
      return {
        actions: [],
        text: "I tried to perform an action but something went wrong.",
        applied: 0,
        skipped: 0,
        failed: true,
        toolResult: { ok: false, error: "Unknown tool" },
      };
  }
}

const runToolCall = async (
  toolCall: ChatCompletionMessageToolCall,
  ctx: ToolContext,
): Promise<ToolOutcome> => {
  if (toolCall.type !== "function") {
    return {
      actions: [],
      text: "I tried to perform an action but something went wrong.",
      applied: 0,
      skipped: 0,
      failed: true,
      toolResult: { ok: false, error: "Unsupported tool call" },
    };
  }

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
  } catch {
    return {
      actions: [],
      text: "I couldn't read the details for that request. Please try again.",
      applied: 0,
      skipped: 0,
      failed: true,
      toolResult: { ok: false, error: "Invalid tool arguments" },
    };
  }

  try {
    return await executeOneTool(toolCall.function.name, args, ctx);
  } catch (error) {
    if (isHandledToolError(error)) {
      return {
        actions: [],
        text: error.message,
        applied: 0,
        skipped: 0,
        failed: true,
        toolResult: { ok: false, error: error.message },
      };
    }
    throw error;
  }
};

const combineOutcomes = (outcomes: ToolOutcome[]) => {
  const texts = outcomes.map((outcome) => outcome.text).filter(Boolean);
  const applied = outcomes.reduce((sum, outcome) => sum + outcome.applied, 0);
  const skipped = outcomes.reduce((sum, outcome) => sum + outcome.skipped, 0);
  const failed = outcomes.filter((outcome) => outcome.failed).length;
  const detail = texts.join(". ");

  if (applied === 0 && skipped === 0 && failed === 0) {
    return detail || "No matching tickets were found for that request.";
  }

  if (failed === outcomes.length || (applied === 0 && skipped > 0)) {
    return detail
      ? `No changes were made. ${detail}.`
      : "No changes were made.";
  }

  if (failed > 0 || skipped > 0) {
    return `Partially done. ${detail}.`;
  }

  return `Done. ${detail}.`;
};

export async function processAiChat(
  input: ProcessInput,
): Promise<AiChatResponse> {
  const ctx = {
    userId: input.userId,
    orgId: input.orgId,
    projectId: input.projectId,
    timeZone: input.timeZone,
  };

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(input.timeZone) },
    ...input.history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user", content: input.message },
  ];

  const outcomes: ToolOutcome[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await openai.chat.completions.create({
      model: "gpt-6-luna",
      messages,
      tools: aiTools,
      tool_choice: "auto",
      parallel_tool_calls: true,
      reasoning_effort: "none",
    });

    const assistantMessage = completion.choices[0]!.message;

    if (!assistantMessage.tool_calls?.length) {
      if (outcomes.length === 0) {
        return {
          message:
            assistantMessage.content ?? "I'm not sure how to help with that.",
          actions: [],
        };
      }
      break;
    }

    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      if (outcomes.length >= MAX_TOOL_CALLS) break;

      const outcome = await runToolCall(toolCall, ctx);
      outcomes.push(outcome);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(outcome.toolResult),
      });
    }

    if (outcomes.length >= MAX_TOOL_CALLS) break;
  }

  return {
    message: combineOutcomes(outcomes),
    actions: outcomes.flatMap((outcome) => outcome.actions),
  };
}
