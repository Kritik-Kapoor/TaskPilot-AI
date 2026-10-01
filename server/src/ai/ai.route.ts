import { Router } from "express";
import { aiChatHandler } from "./ai.controller.js";

const router = Router();

router.post("/chat", aiChatHandler);

export default router;
