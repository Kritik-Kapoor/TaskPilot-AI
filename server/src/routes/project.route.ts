import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
  updateProjectMember,
} from "../controllers/project.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";

const router = Router();

router.post("/", authenticateUser, createProject);
router.get("/:projectId", authenticateUser, getProject);
router.delete("/:projectId", authenticateUser, deleteProject);
router.patch("/:projectId", authenticateUser, updateProject);
router.post(
  "/:projectId/members/:action",
  authenticateUser,
  updateProjectMember,
);

export default router;
