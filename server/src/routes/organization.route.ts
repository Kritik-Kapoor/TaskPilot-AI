import { Router } from "express";
import {
  checkOrganizationName,
  createOrganization,
  deleteOrganization,
  getMyJoinRequests,
  getOrganization,
  getProjectsList,
  joinRequest,
  searchOrganizations,
  transferOwnership,
  updateOrganization,
} from "../controllers/organization.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";
import { authenticateWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  checkOrganizationNameQuerySchema,
  createOrganizationSchema,
  organizationIdParamsSchema,
  searchOrganizationsQuerySchema,
  transferOwnershipParamsSchema,
  updateOrganizationSchema,
} from "../schemas/organization.schema.js";

const router = Router();

router.post(
  "/create",
  authenticateUser,
  validate(createOrganizationSchema),
  createOrganization,
);
router.get("/", authenticateWorkspaceUser, getOrganization);
router.delete("/", authenticateWorkspaceUser, deleteOrganization);
router.patch(
  "/",
  authenticateWorkspaceUser,
  validate(updateOrganizationSchema),
  updateOrganization,
);
router.post(
  "/transfer-ownership/:newOwnerId",
  authenticateWorkspaceUser,
  validate(transferOwnershipParamsSchema, "params"),
  transferOwnership,
);
router.get("/projects", authenticateWorkspaceUser, getProjectsList);
router.get(
  "/search",
  authenticateUser,
  validate(searchOrganizationsQuerySchema, "query"),
  searchOrganizations,
);
router.get(
  "/check",
  authenticateUser,
  validate(checkOrganizationNameQuerySchema, "query"),
  checkOrganizationName,
);
router.get("/join-requests", authenticateUser, getMyJoinRequests);
router.post(
  "/join-request/:orgId",
  authenticateUser,
  validate(organizationIdParamsSchema, "params"),
  joinRequest,
);

export default router;
