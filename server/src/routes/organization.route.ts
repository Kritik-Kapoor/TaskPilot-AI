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
router.get("/", authenticateUser, getOrganization);
router.delete("/", authenticateUser, deleteOrganization);
router.patch(
  "/",
  authenticateUser,
  validate(updateOrganizationSchema),
  updateOrganization,
);
router.post(
  "/transfer-ownership/:newOwnerId",
  authenticateUser,
  validate(transferOwnershipParamsSchema, "params"),
  transferOwnership,
);
router.get("/projects", authenticateUser, getProjectsList);
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
