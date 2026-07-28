import { prisma } from "../config/db.js";
import type { Response } from "express";
import {
  issueAuthTokens,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../utils/generateToken.js";

export const getUserAuthPayload = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
      organizationId: true,
      organizationRole: true,
      organization: {
        select: {
          orgName: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  return {
    email: user.email,
    username: user.username,
    organizationId: user.organizationId,
    organizationRole: user.organizationRole,
    organizationName: user.organization?.orgName ?? null,
    organizationProjectCount: user.organization?._count.projects ?? 0,
  };
};

export const refreshAuthSession = async (
  refreshToken: string,
  res: Response,
): Promise<AccessTokenPayload | null> => {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { organizationId: true },
  });

  if (!user) return null;

  const payload: AccessTokenPayload = {
    userId: decoded.userId,
    orgId: user.organizationId,
  };

  issueAuthTokens(res, payload);

  return payload;
};
