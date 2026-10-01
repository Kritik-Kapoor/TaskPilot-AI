import { openai } from "../config/openai.js";
import { aiTools } from "./ai.tools.js";
import {
  executeFilterBoard,
  executeCreateIssueType,
  executeCreateTicket,
  executeAssignTickets,
  executeOpenConfig,
} from "./ai.tool-executor.js";
import { AiChatError } from "./ai.errors.js";
import { TicketServiceError } from "../services/ticket.service.js";
import type { AiAction, AiChatResponse } from "./ai.types.js";
import { formatTodayInTimeZone } from "../utils/assignmentDate.utils.js";

const buildSystemPrompt = (timeZone: string) => {
  const today = formatTodayInTimeZone(timeZone);

  return `You are TaskPilot AI. A helpful project management assistant embedded in a task tracking app.
Today's date in the user's timezone (${timeZone}) is ${today} (YYYY-MM-DD). Use this to resolve relative dates
like "today", "yesterday", or "last 3 days" into absolute YYYY-MM-DD values before calling a tool.

You can help users:
- Filter and find tickets on the board
- Create new tickets
- Create new issue types
- Assign or re-assign tickets to project members
- Open configuration pages

When the user asks to see or find tickets, use filter_board.
When the user asks to create a ticket, use create_ticket.
When the user asks to add a new issue type, use create_issue_type.
When the user asks to assign, re-assign, take, or give a ticket to someone, use assign_tickets —
always use this single tool regardless of whether the ticket(s) are currently assigned or not;
the server figures out per-ticket whether it's an assign or a re-assign.
When the user asks about configuration/settings for labels/statuses/types, use open_configuration.

For assignee filters, pass an "assignees" array — one entry per person:
- "current_user" when they mean themselves (me, my tickets)
- "unassigned" for tickets with no assignee
- an email address for each other project member they mention
The user may combine these, e.g. "show tickets for me and jane@company.com" → assignees: ["current_user", "jane@company.com"].
If they refer to another person by name without an email, do NOT call filter_board at all — ask for that person's email instead.

For assign_tickets, the "assignee" is a single target ("current_user" or one email address), and you must
pick exactly one ticket selector: ticketKeys (e.g. ["TB-101", "TB-102"]), date (a single YYYY-MM-DD), or
dateRange ({from, to}). If a person is named without an email, do NOT call assign_tickets — ask for their
email instead. If the user doesn't say which tickets, ask them to clarify rather than guessing.

Keep text responses brief and friendly. Always use a tool when the user's intent matches one.
If you cannot determine the user's intent, ask a clarifying question, do NOT make assumptions.`;
};

type ProcessInput = {
  message: string;
  userId: string;
  orgId: string;
  projectId: string;
  timeZone: string;
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt(input.timeZone) },
      { role: "user", content: input.message },
    ],
    tools: aiTools,
    tool_choice: "auto",
  });

  const choice = completion.choices[0]!;
  const assistantMessage = choice.message;

  if (!assistantMessage.tool_calls?.length) {
    return {
      message:
        assistantMessage.content ?? "I'm not sure how to help with that.",
      action: null,
    };
  }

  const toolCall = assistantMessage.tool_calls[0]!;

  if (toolCall.type !== "function") {
    return {
      message:
        assistantMessage.content ?? "I'm not sure how to help with that.",
      action: null,
    };
  }

  const args = JSON.parse(toolCall.function.arguments);

  let action: AiAction;
  let responseText: string;

  try {
    switch (toolCall.function.name) {
      case "filter_board": {
        action = await executeFilterBoard(args, ctx);
        const requestedFilters: string[] = [];
        if (args.assignees?.length) {
          const assigneeLabels = (args.assignees as string[]).map(
            (a: string) => {
              if (a === "current_user") return "you";
              if (a === "unassigned") return "unassigned";
              return a;
            },
          );
          requestedFilters.push(`assigned to ${assigneeLabels.join(", ")}`);
        }
        if (args.priority) requestedFilters.push(`${args.priority} priority`);
        if (args.type) requestedFilters.push(`type: ${args.type}`);
        if (args.labels?.length)
          requestedFilters.push(`labels: ${args.labels.join(", ")}`);
        if (args.query) requestedFilters.push(`matching "${args.query}"`);

        responseText =
          requestedFilters.length > 0
            ? `Showing tickets ${requestedFilters.join(", ")}. Navigating to board…`
            : "Opening the board with all tickets.";
        break;
      }

      case "create_issue_type": {
        action = await executeCreateIssueType(args, ctx);
        responseText = `Created issue type "${args.key}". Opening configuration…`;
        break;
      }

      case "create_ticket": {
        action = await executeCreateTicket(args, ctx);
        const ticket = (action as Extract<AiAction, { type: "create_ticket" }>)
          .ticket;

        responseText = `Created ticket ${ticket.ticketKey}: "${ticket.title}". Navigating to board…`;
        break;
      }

      case "assign_tickets": {
        action = (await executeAssignTickets(args, ctx)) as Extract<
          AiAction,
          { type: "assign_tickets" }
        >;

        const parts: string[] = [];
        if (action.assigned.length > 0) {
          parts.push(
            `Assigned ${action.assigned.map((t) => t.ticketKey).join(", ")} to ${action.assignee.username}`,
          );
        }
        if (action.reassigned.length > 0) {
          parts.push(
            `Re-assigned ${action.reassigned.map((t) => t.ticketKey).join(", ")} to ${action.assignee.username}`,
          );
        }
        if (action.skipped.length > 0) {
          parts.push(
            `Skipped ${action.skipped.map((s) => `${s.ticketKey} (${s.reason})`).join(", ")}`,
          );
        }

        responseText =
          parts.length > 0
            ? `Done. ${parts.join("; ")}.`
            : "No matching tickets were found for that request.";
        break;
      }

      case "open_configuration": {
        action = executeOpenConfig(args);
        const tabNames = {
          labels: "Labels",
          statuses: "Statuses",
          types: "Issue Types",
        };

        responseText = `Opening ${tabNames[args.tab as keyof typeof tabNames]} configuration…`;
        break;
      }

      default:
        return {
          message: "I tried to perform an action but something went wrong.",
          action: null,
        };
    }
  } catch (error) {
    if (error instanceof AiChatError || error instanceof TicketServiceError) {
      return { message: error.message, action: null };
    }
    throw error;
  }

  return {
    message: responseText,
    action,
  };
}
