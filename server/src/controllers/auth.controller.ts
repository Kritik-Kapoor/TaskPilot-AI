import { prisma } from "../config/db.js";
import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import { issueAuthTokens } from "../utils/generateToken.js";
import { clearAuthCookies, REFRESH_COOKIE_NAME } from "../utils/authCookie.js";
import type {
  SigninInput,
  SignupInput,
  UpdateProfileInput,
} from "../schemas/auth.schema.js";
import {
  createUserInDefaultWorkspace,
  getUserAuthPayload,
  refreshAuthSession,
  updateUserProfile,
  deleteUserAccount,
} from "../services/auth.service.js";

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.validated!.body as SignupInput;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      return new ApiResponse(400, null, "User already exists").send(res);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUserInDefaultWorkspace({
      username,
      email,
      passwordHash: hashedPassword,
    });

    issueAuthTokens(res, { userId: user.id, orgId: user.organizationId });

    const authUser = await getUserAuthPayload(user.id);

    if (!authUser) {
      return new ApiResponse(404, null, "User not found").send(res);
    }

    return new ApiResponse(200, authUser, "Signup successful").send(res);
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

    issueAuthTokens(res, { userId: user.id, orgId: user.organizationId });

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
    clearAuthCookies(res);
    return new ApiResponse(200, null, "Signout successful").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!token)
      return new ApiResponse(401, null, "Refresh token not provided").send(res);

    const session = await refreshAuthSession(token, res);

    if (!session) {
      clearAuthCookies(res);
      return new ApiResponse(401, null, "Invalid refresh token").send(res);
    }

    return new ApiResponse(200, null, "Token refreshed successfully").send(res);
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

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { username } = req.validated!.body as UpdateProfileInput;

    const user = await updateUserProfile(userId, username);

    return new ApiResponse(200, user, "Profile updated successfully").send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiResponse(error.statusCode, null, error.message).send(res);
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;

    await deleteUserAccount(userId);
    clearAuthCookies(res);

    return new ApiResponse(200, null, "Account deleted successfully").send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiResponse(error.statusCode, null, error.message).send(res);
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
