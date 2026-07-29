import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiResponse.js";
import { authenticateUser } from "./authenticateUser.middleware.js";

export type WorkspaceUser = {
  userId: string;
  orgId: string;
};

export const getWorkspaceUser = (req: Request): WorkspaceUser => {
  const { userId, orgId } = req.user!;

  return {
    userId,
    orgId: orgId!,
  };
};

export const authenticateWorkspaceUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  authenticateUser(req, res, () => {
    if (!req.user?.userId || !req.user.orgId) {
      return new ApiError(
        401,
        "Unauthorized user, organization membership required",
      ).send(res);
    }

    next();
  });
};
