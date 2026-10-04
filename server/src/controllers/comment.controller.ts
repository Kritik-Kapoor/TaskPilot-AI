import { Request, Response } from "express";
import { ApiError, ApiResponse, getErrorMessage } from "../utils/apiResponse.js";
import type {
  CreateCommentInput,
  TicketCommentParams,
} from "../schemas/comment.schema.js";
import {
  createTicketComment,
  getTicketComments,
} from "../services/comment.service.js";
import { getWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";

const handleCommentServiceError = (error: unknown, res: Response) => {
  if (error instanceof ApiError) {
    return new ApiResponse(error.statusCode, null, error.message).send(res);
  }

  return new ApiError(500, getErrorMessage(error)).send(res);
};

export const getTicketCommentsHandler = async (req: Request, res: Response) => {
  try {
    const { projectId, ticketId } = req.validated!.params as TicketCommentParams;
    const { userId, orgId } = getWorkspaceUser(req);

    const comments = await getTicketComments(
      orgId,
      projectId,
      userId,
      ticketId,
    );

    return new ApiResponse(
      200,
      comments,
      "Ticket comments fetched successfully",
    ).send(res);
  } catch (error) {
    return handleCommentServiceError(error, res);
  }
};

export const createTicketCommentHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { projectId, ticketId } = req.validated!.params as TicketCommentParams;
    const body = req.validated!.body as CreateCommentInput;
    const { userId, orgId } = getWorkspaceUser(req);

    const comment = await createTicketComment(
      orgId,
      projectId,
      userId,
      ticketId,
      body,
    );

    return new ApiResponse(201, comment, "Comment added successfully").send(
      res,
    );
  } catch (error) {
    return handleCommentServiceError(error, res);
  }
};
