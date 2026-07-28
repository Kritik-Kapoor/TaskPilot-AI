import { Router } from "express";
import {
  getUser,
  refreshToken,
  signin,
  signout,
  signup,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";
import { validate } from "../middlewares/validateSchema.middleware.js";
import { signinSchema, signupSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/signin", validate(signinSchema), signin);
router.post("/signout", signout);
router.post("/refresh", refreshToken);
router.get("/user", authenticateUser, getUser);

export default router;
