import { Router } from "express";
import {
  createTicketHandler,
  deleteTicketHandler,
  getProjectBacklogTicketsHandler,
  getProjectColumnsHandler,
  getProjectTicketsHandler,
  getTicketByIdHandler,
  updateTicketHandler,
} from "../controllers/ticket.controller.js";
import {
  createTicketCommentHandler,
  getTicketCommentsHandler,
} from "../controllers/comment.controller.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  createCommentSchema,
  ticketCommentParamsSchema,
} from "../schemas/comment.schema.js";
import {
  createTicketSchema,
  ticketIdParamsSchema,
  updateTicketSchema,
} from "../schemas/ticket.schema.js";
import { projectIdParamsSchema } from "../schemas/project.schema.js";

const router = Router();

router.post("/", validate(createTicketSchema), createTicketHandler);

router.get(
  "/project-board/:projectId",
  validate(projectIdParamsSchema, "params"),
  getProjectTicketsHandler,
);

router.get(
  "/project-backlog/:projectId",
  validate(projectIdParamsSchema, "params"),
  getProjectBacklogTicketsHandler,
);

router.get(
  "/project-columns/:projectId",
  validate(projectIdParamsSchema, "params"),
  getProjectColumnsHandler,
);

router.get(
  "/:projectId/:ticketId/comments",
  validate(ticketCommentParamsSchema, "params"),
  getTicketCommentsHandler,
);

router.post(
  "/:projectId/:ticketId/comments",
  validate(ticketCommentParamsSchema, "params"),
  validate(createCommentSchema),
  createTicketCommentHandler,
);

router.get(
  "/:projectId/:ticketId",
  validate(ticketIdParamsSchema, "params"),
  getTicketByIdHandler,
);

router.patch(
  "/:projectId/:ticketId",
  validate(ticketIdParamsSchema, "params"),
  validate(updateTicketSchema),
  updateTicketHandler,
);

router.delete(
  "/:projectId/:ticketId",
  validate(ticketIdParamsSchema, "params"),
  deleteTicketHandler,
);

export default router;
