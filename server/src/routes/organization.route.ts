import { Router } from "express";
import {
  createOrganization,
  deleteOrganization,
  getOrganization,
  getProjectsList,
  transferOwnership,
  updateOrganization,
} from "../controllers/organization.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";

const router = Router();

router.post("/", authenticateUser, createOrganization);
router.get("/", authenticateUser, getOrganization);
router.delete("/", authenticateUser, deleteOrganization);
router.patch("/", authenticateUser, updateOrganization);
router.post(
  "/transfer-ownership/:newOwnerId",
  authenticateUser,
  transferOwnership,
);
router.get("/projects", authenticateUser, getProjectsList);

export default router;
