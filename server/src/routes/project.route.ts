import { Router } from "express";
import {
  createLabel,
  createProject,
  deleteProject,
  getLabels,
  getProject,
  getProjectBoardColumns,
  getProjectMembers,
  getUserRoleInProject,
  updateLabel,
  updateProject,
  updateProjectMember,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  createLabelBodySchema,
  createProjectSchema,
  projectIdParamsSchema,
  updateLabelParamsSchema,
  updateProjectMemberBodySchema,
  updateProjectMemberParamsSchema,
  updateProjectSchema,
} from "../schemas/project.schema.js";
import { getUserRoleInProjectSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/create", validate(createProjectSchema), createProject);

router.get(
  "/:projectId",
  validate(projectIdParamsSchema, "params"),
  getProject,
);

router.delete(
  "/:projectId",
  validate(projectIdParamsSchema, "params"),
  deleteProject,
);

router.patch(
  "/:projectId",
  validate(projectIdParamsSchema, "params"),
  validate(updateProjectSchema),
  updateProject,
);

router.post(
  "/:projectId/members/:action",
  validate(updateProjectMemberParamsSchema, "params"),
  validate(updateProjectMemberBodySchema),
  updateProjectMember,
);

router.get(
  "/:projectId/role",
  validate(getUserRoleInProjectSchema, "params"),
  getUserRoleInProject,
);

router.get(
  "/:projectId/members",
  validate(projectIdParamsSchema, "params"),
  getProjectMembers,
);

router.get(
  "/:projectId/board-columns",
  validate(projectIdParamsSchema, "params"),
  getProjectBoardColumns,
);

router.post(
  "/:projectId/labels",
  validate(projectIdParamsSchema, "params"),
  validate(createLabelBodySchema),
  createLabel,
);

router.patch(
  "/:projectId/labels/:labelId",
  validate(updateLabelParamsSchema, "params"),
  validate(createLabelBodySchema),
  updateLabel,
);

router.get(
  "/:projectId/labels",
  validate(projectIdParamsSchema, "params"),
  getLabels,
);

export default router;
