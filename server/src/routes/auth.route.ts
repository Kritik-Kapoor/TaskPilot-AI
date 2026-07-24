import { Router } from "express";
import {
  getUser,
  signin,
  signout,
  signup,
} from "../controllers/auth.controller.js";
import { authenticateUser } from "../middlewares/authenticateUser.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
router.get("/user", authenticateUser, getUser);

export default router;
