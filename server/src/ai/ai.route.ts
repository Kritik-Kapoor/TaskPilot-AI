import { Router } from "express";
import { validate } from "../middlewares/validateSchema.middleware.js";
import { projectIdParamsSchema } from "../schemas/project.schema.js";
import { aiChatHandler, aiChatHistoryHandler } from "./ai.controller.js";

const router = Router();

router.get(
  "/chat/history/:projectId",
  validate(projectIdParamsSchema, "params"),
  aiChatHistoryHandler,
);

router.post("/chat", aiChatHandler);

export default router;
