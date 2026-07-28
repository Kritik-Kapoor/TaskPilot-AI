import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiResponse.js";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  clearAuthCookies,
} from "../utils/authCookie.js";
import { refreshAuthSession } from "../services/auth.service.js";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.cookies[AUTH_COOKIE_NAME] as string | undefined;
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;

    if (!accessToken && !refreshToken)
      return new ApiError(401, "Unauthorized user, No token provided").send(
        res,
      );

    if (accessToken) {
      try {
        const decoded = jwt.verify(
          accessToken,
          process.env.JWT_SECRET!,
        ) as jwt.JwtPayload;

        if (!decoded.userId) {
          return new ApiError(401, "Unauthorized user, Invalid token").send(
            res,
          );
        }

        req.user = {
          userId: decoded.userId,
          orgId: decoded.orgId ?? null,
        };

        return next();
      } catch (error) {
        const canRefresh =
          error instanceof jwt.TokenExpiredError && Boolean(refreshToken);

        if (!canRefresh) {
          return new ApiError(401, "Unauthorized user, Invalid token").send(
            res,
          );
        }
      }
    }

    const session = await refreshAuthSession(refreshToken!, res);

    if (!session) {
      clearAuthCookies(res);
      return new ApiError(401, "Unauthorized user, Invalid token").send(res);
    }

    req.user = {
      userId: session.userId,
      orgId: session.orgId,
    };

    next();
  } catch {
    return new ApiError(401, "Unauthorized user, Invalid token").send(res);
  }
};
