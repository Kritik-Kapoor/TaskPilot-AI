import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import type {
  CreateTicketInput,
  TicketIdParams,
  UpdateTicketInput,
} from "../schemas/ticket.schema.js";
import {
  createTicket,
  deleteTicket,
  getProjectTickets,
  getTicketById,
  TicketServiceError,
  updateTicket,
} from "../services/ticket.service.js";
import { getWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";
import { ProjectIdParams } from "../schemas/project.schema.js";

const handleTicketServiceError = (error: unknown, res: Response) => {
  if (error instanceof TicketServiceError) {
    return new ApiResponse(error.statusCode, null, error.message).send(res);
  }

  return new ApiError(500, getErrorMessage(error)).send(res);
};

export const createTicketHandler = async (req: Request, res: Response) => {
  try {
    const body = req.validated!.body as CreateTicketInput;
    const { userId, orgId } = getWorkspaceUser(req);

    const ticket = await createTicket(orgId, userId, body);

    return new ApiResponse(201, { ticket }, "Ticket created successfully").send(
      res,
    );
  } catch (error) {
    return handleTicketServiceError(error, res);
  }
};

export const getProjectTicketsHandler = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { userId, orgId } = getWorkspaceUser(req);

    const board = await getProjectTickets(orgId, userId, projectId);

    return new ApiResponse(
      200,
      board,
      "Project tickets fetched successfully",
    ).send(res);
  } catch (error) {
    return handleTicketServiceError(error, res);
  }
};

export const getTicketByIdHandler = async (req: Request, res: Response) => {
  try {
    const { projectId, ticketId } = req.validated!.params as TicketIdParams;
    const { userId, orgId } = getWorkspaceUser(req);

    const ticket = await getTicketById(orgId, projectId, userId, ticketId);

    return new ApiResponse(200, { ticket }, "Ticket fetched successfully").send(
      res,
    );
  } catch (error) {
    return handleTicketServiceError(error, res);
  }
};

export const updateTicketHandler = async (req: Request, res: Response) => {
  try {
    const { projectId, ticketId } = req.validated!.params as TicketIdParams;
    const body = req.validated!.body as UpdateTicketInput;
    const { userId, orgId } = getWorkspaceUser(req);

    const ticket = await updateTicket(orgId, projectId, userId, ticketId, body);

    return new ApiResponse(200, { ticket }, "Ticket updated successfully").send(
      res,
    );
  } catch (error) {
    return handleTicketServiceError(error, res);
  }
};

export const deleteTicketHandler = async (req: Request, res: Response) => {
  try {
    const { projectId, ticketId } = req.validated!.params as TicketIdParams;
    const { userId, orgId } = getWorkspaceUser(req);

    const deletedTicket = await deleteTicket(
      orgId,
      projectId,
      userId,
      ticketId,
    );

    return new ApiResponse(
      200,
      deletedTicket,
      "Ticket deleted successfully",
    ).send(res);
  } catch (error) {
    return handleTicketServiceError(error, res);
  }
};
