import { Router } from "express";
import {
  createBoardColumn,
  createIssueType,
  createLabel,
  createProject,
  deleteBoardColumn,
  deleteIssueType,
  deleteLabel,
  deleteProject,
  deleteProjectMember,
  getLabels,
  getProject,
  getProjectBoardColumns,
  getProjectMembers,
  getProjectTicketTypes,
  getUserRoleInProject,
  joinDefaultProject,
  patchProjectMember,
  reorderBoardColumns,
  updateBoardColumn,
  updateLabel,
  updateProject,
  updateProjectDefaultStatus,
  updateProjectMember,
  updateIssueType,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  boardColumnParamsSchema,
  boardColumnBodySchema,
  deleteBoardColumnBodySchema,
  createIssueTypeBodySchema,
  createLabelBodySchema,
  createProjectSchema,
  patchProjectMemberBodySchema,
  projectIdParamsSchema,
  projectMemberUserIdParamsSchema,
  reorderBoardColumnsBodySchema,
  updateLabelParamsSchema,
  updateProjectMemberBodySchema,
  updateProjectMemberParamsSchema,
  updateProjectDefaultParamsSchema,
  updateProjectSchema,
  updateIssueTypeBodySchema,
  updateIssueTypeParamsSchema,
} from "../schemas/project.schema.js";
import { getUserRoleInProjectSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/create", validate(createProjectSchema), createProject);

router.post("/join-default", joinDefaultProject);

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

router.patch(
  "/:projectId/default/:isDefault",
  validate(updateProjectDefaultParamsSchema, "params"),
  updateProjectDefaultStatus,
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

router.patch(
  "/:projectId/members/:userId",
  validate(projectMemberUserIdParamsSchema, "params"),
  validate(patchProjectMemberBodySchema),
  patchProjectMember,
);

router.delete(
  "/:projectId/members/:userId",
  validate(projectMemberUserIdParamsSchema, "params"),
  deleteProjectMember,
);

router.get(
  "/:projectId/board-columns",
  validate(projectIdParamsSchema, "params"),
  getProjectBoardColumns,
);

router.post(
  "/:projectId/board-columns",
  validate(projectIdParamsSchema, "params"),
  validate(boardColumnBodySchema),
  createBoardColumn,
);

router.patch(
  "/:projectId/board-columns/reorder",
  validate(projectIdParamsSchema, "params"),
  validate(reorderBoardColumnsBodySchema),
  reorderBoardColumns,
);

router.patch(
  "/:projectId/board-columns/:columnId",
  validate(boardColumnParamsSchema, "params"),
  validate(boardColumnBodySchema),
  updateBoardColumn,
);

router.delete(
  "/:projectId/board-columns/:columnId",
  validate(boardColumnParamsSchema, "params"),
  validate(deleteBoardColumnBodySchema),
  deleteBoardColumn,
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

router.delete(
  "/:projectId/labels/:labelId",
  validate(updateLabelParamsSchema, "params"),
  deleteLabel,
);

router.get(
  "/:projectId/labels",
  validate(projectIdParamsSchema, "params"),
  getLabels,
);

router.get(
  "/:projectId/ticket-types",
  validate(projectIdParamsSchema, "params"),
  getProjectTicketTypes,
);

router.post(
  "/:projectId/ticket-types",
  validate(projectIdParamsSchema, "params"),
  validate(createIssueTypeBodySchema),
  createIssueType,
);

router.patch(
  "/:projectId/ticket-types/:typeId",
  validate(updateIssueTypeParamsSchema, "params"),
  validate(updateIssueTypeBodySchema),
  updateIssueType,
);

router.delete(
  "/:projectId/ticket-types/:typeId",
  validate(updateIssueTypeParamsSchema, "params"),
  deleteIssueType,
);

export default router;
