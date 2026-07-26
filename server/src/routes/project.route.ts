import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  updateProject,
  updateProjectMember,
} from "../controllers/project.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectMemberBodySchema,
  updateProjectMemberParamsSchema,
  updateProjectSchema,
} from "../schemas/project.schema.js";

const router = Router();

router.post(
  "/create",
  authenticateUser,
  validate(createProjectSchema),
  createProject,
);
router.get(
  "/:projectId",
  authenticateUser,
  validate(projectIdParamsSchema, "params"),
  getProject,
);
router.delete(
  "/:projectId",
  authenticateUser,
  validate(projectIdParamsSchema, "params"),
  deleteProject,
);
router.patch(
  "/:projectId",
  authenticateUser,
  validate(projectIdParamsSchema, "params"),
  validate(updateProjectSchema),
  updateProject,
);
router.post(
  "/:projectId/members/:action",
  authenticateUser,
  validate(updateProjectMemberParamsSchema, "params"),
  validate(updateProjectMemberBodySchema),
  updateProjectMember,
);

export default router;
