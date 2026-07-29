import { Router } from "express";
import {
  createTicketHandler,
  deleteTicketHandler,
  getProjectTicketsHandler,
  getTicketByIdHandler,
  updateTicketHandler,
} from "../controllers/ticket.controller.js";
import { authenticateWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  createTicketSchema,
  ticketIdParamsSchema,
  updateTicketSchema,
} from "../schemas/ticket.schema.js";
import { projectIdParamsSchema } from "../schemas/project.schema.js";

const router = Router();

router.post(
  "/",
  authenticateWorkspaceUser,
  validate(createTicketSchema),
  createTicketHandler,
);

router.get(
  "/project-board/:projectId",
  authenticateWorkspaceUser,
  validate(projectIdParamsSchema, "params"),
  getProjectTicketsHandler,
);

router.get(
  "/:projectId/:ticketId",
  authenticateWorkspaceUser,
  validate(ticketIdParamsSchema, "params"),
  getTicketByIdHandler,
);

router.patch(
  "/:projectId/:ticketId",
  authenticateWorkspaceUser,
  validate(ticketIdParamsSchema, "params"),
  validate(updateTicketSchema),
  updateTicketHandler,
);

router.delete(
  "/:projectId/:ticketId",
  authenticateWorkspaceUser,
  validate(ticketIdParamsSchema, "params"),
  deleteTicketHandler,
);

export default router;
