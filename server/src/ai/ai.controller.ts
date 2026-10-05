import { Request, Response } from "express";
import { z } from "zod";
import type { ProjectIdParams } from "../schemas/project.schema.js";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import {
  appendAiChatTurn,
  listAiChatHistory,
  loadAiChatHistoryForModel,
} from "./aiChatHistory.service.js";
import { processAiChat } from "./ai.service.js";
import {
  AssignmentTimeZoneError,
  resolveAssignmentTimeZone,
} from "../utils/assignmentDate.utils.js";

const aiChatBodySchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  projectId: z.uuid("Invalid project ID"),
  timeZone: z.string().trim().min(1).optional(),
});

const handleAiAccessError = (error: unknown, res: Response) => {
  if (error instanceof ApiError) {
    return new ApiResponse(error.statusCode, null, error.message).send(res);
  }
  return new ApiError(500, getErrorMessage(error)).send(res);
};

export const aiChatHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { userId, orgId } = req.user!;

    if (!userId || !orgId) {
      return new ApiResponse(401, null, "Unauthorized").send(res);
    }

    const { projectId } = req.validated!.params as ProjectIdParams;

    const messages = await listAiChatHistory(userId, orgId, projectId);

    return new ApiResponse(200, { messages }, "AI chat history fetched").send(
      res,
    );
  } catch (error) {
    return handleAiAccessError(error, res);
  }
};

export const aiChatHandler = async (req: Request, res: Response) => {
  try {
    const { userId, orgId } = req.user!;

    if (!userId || !orgId) {
      return new ApiResponse(401, null, "Unauthorized").send(res);
    }

    const parsed = aiChatBodySchema.safeParse(req.body);

    if (!parsed.success) {
      return new ApiResponse(
        400,
        null,
        parsed.error.issues[0]?.message ?? "Invalid request",
      ).send(res);
    }

    let timeZone: string;
    try {
      timeZone = resolveAssignmentTimeZone(parsed.data.timeZone);
    } catch (error) {
      if (error instanceof AssignmentTimeZoneError) {
        return new ApiResponse(400, null, error.message).send(res);
      }
      throw error;
    }

    const { message, projectId } = parsed.data;

    const history = await loadAiChatHistoryForModel(userId, orgId, projectId);

    const result = await processAiChat({
      message,
      history,
      projectId,
      userId,
      orgId,
      timeZone,
    });

    await appendAiChatTurn({
      userId,
      orgId,
      projectId,
      userContent: message,
      assistantContent: result.message,
      actions: result.actions,
    });

    return new ApiResponse(200, result, "AI response generated").send(res);
  } catch (error) {
    return handleAiAccessError(error, res);
  }
};
