import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  getUserRoleInProject,
  updateProject,
  updateProjectMember,
} from "../controllers/project.controller.js";
import { authenticateWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectMemberBodySchema,
  updateProjectMemberParamsSchema,
  updateProjectSchema,
} from "../schemas/project.schema.js";
import { getUserRoleInProjectSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post(
  "/create",
  authenticateWorkspaceUser,
  validate(createProjectSchema),
  createProject,
);
router.get(
  "/:projectId",
  authenticateWorkspaceUser,
  validate(projectIdParamsSchema, "params"),
  getProject,
);
router.delete(
  "/:projectId",
  authenticateWorkspaceUser,
  validate(projectIdParamsSchema, "params"),
  deleteProject,
);
router.patch(
  "/:projectId",
  authenticateWorkspaceUser,
  validate(projectIdParamsSchema, "params"),
  validate(updateProjectSchema),
  updateProject,
);
router.post(
  "/:projectId/members/:action",
  authenticateWorkspaceUser,
  validate(updateProjectMemberParamsSchema, "params"),
  validate(updateProjectMemberBodySchema),
  updateProjectMember,
);
router.get(
  "/:projectId/role",
  authenticateWorkspaceUser,
  validate(getUserRoleInProjectSchema, "params"),
  getUserRoleInProject,
);

export default router;
