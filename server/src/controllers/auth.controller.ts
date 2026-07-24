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

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return new ApiResponse(400, null, "Missing required fields").send(res);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      return new ApiResponse(400, null, "User already exists").send(res);

    if (password.length < 8)
      return new ApiError(
        400,
        "Password must be at least 8 characters long",
      ).send(res);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
      },
    });

    generateAccessToken({ userId: user.id, orgId: null }, res);

    return new ApiResponse(
      200,
      {
        user: {
          username: user.username,
          email: user.email,
        },
      },
      "Signup successful",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return new ApiResponse(400, null, "Email and password are required").send(
        res,
      );

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user)
      return new ApiResponse(401, null, "Invalid email or password").send(res);

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      return new ApiResponse(401, null, "Invalid email or password").send(res);

    generateAccessToken({ userId: user.id, orgId: user.organizationId }, res);

    return new ApiResponse(
      200,
      {
        user: {
          username: user.username,
          email: user.email,
          organizationId: user.organizationId,
          organizationRole: user.organizationRole,
        },
      },
      "Login successful",
    ).send(res);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        username: true,
        organizationId: true,
        organizationRole: true,
      },
    });

    if (!user) return new ApiResponse(404, null, "User not found").send(res);

    return new ApiResponse(200, { user }, "User fetched successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
