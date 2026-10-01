import { Request, Response } from "express";
import { z } from "zod";
import { ApiError, ApiResponse, getErrorMessage } from "../utils/apiResponse.js";
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

    const result = await processAiChat({
      message: parsed.data.message,
      projectId: parsed.data.projectId,
      userId,
      orgId,
      timeZone,
    });

    return new ApiResponse(200, result, "AI response generated").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
