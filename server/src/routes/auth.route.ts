import { Router } from "express";
import {
  deleteUser,
  getUser,
  refreshToken,
  signin,
  signout,
  signup,
  updateUser,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import {
  signinSchema,
  signupSchema,
  updateProfileSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/signin", validate(signinSchema), signin);
router.post("/signout", signout);
router.post("/refresh", refreshToken);
router.get("/user", authenticateUser, getUser);

router.patch(
  "/user",
  authenticateUser,
  validate(updateProfileSchema),
  updateUser,
);

router.delete("/user", authenticateUser, deleteUser);

export default router;
