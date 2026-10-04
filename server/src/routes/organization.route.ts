import { Router } from "express";
import {
  getOrganization,
  getProjectsList,
  updateOrganization,
} from "../controllers/organization.controller.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import { updateOrganizationSchema } from "../schemas/organization.schema.js";

const router = Router();

router.get("/", getOrganization);

router.patch("/", validate(updateOrganizationSchema), updateOrganization);

router.get("/projects", getProjectsList);

export default router;
