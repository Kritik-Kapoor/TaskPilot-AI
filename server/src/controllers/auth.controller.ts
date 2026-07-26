import { prisma } from "../config/db.js";
import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import { generateAccessToken } from "../utils/generateToken.js";
import { clearAuthCookie } from "../utils/authCookie.js";
import type { SigninInput, SignupInput } from "../schemas/auth.schema.js";
import { getUserAuthPayload } from "../services/auth.service.js";

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.validated!.body as SignupInput;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      return new ApiResponse(400, null, "User already exists").send(res);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        isPrivacyPolicyAccepted: true,
      },
    });

    generateAccessToken({ userId: user.id, orgId: null }, res);

    return new ApiResponse(
      200,
      {
        username: user.username,
        email: user.email,
      },
      "Signup successful",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.validated!.body as SigninInput;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user)
      return new ApiResponse(401, null, "Invalid email or password").send(res);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      return new ApiResponse(401, null, "Invalid email or password").send(res);

    generateAccessToken({ userId: user.id, orgId: user.organizationId }, res);

    const authUser = await getUserAuthPayload(user.id);

    if (!authUser) {
      return new ApiResponse(404, null, "User not found").send(res);
    }

    return new ApiResponse(200, authUser, "Login successful").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const signout = async (req: Request, res: Response) => {
  try {
    clearAuthCookie(res);
    return new ApiResponse(200, null, "Signout successful").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;

    const user = await getUserAuthPayload(userId);

    if (!user) return new ApiResponse(404, null, "User not found").send(res);

    return new ApiResponse(200, user, "User fetched successfully").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
