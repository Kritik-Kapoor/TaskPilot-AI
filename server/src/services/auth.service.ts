import { prisma } from "../config/db.js";
import { ApiError } from "../utils/apiResponse.js";
import type { Response } from "express";
import {
  issueAuthTokens,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../utils/generateToken.js";

const userAuthSelect = {
  email: true,
  username: true,
  createdAt: true,
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
  projectMembers: {
    select: {
      role: true,
      project: {
        select: {
          id: true,
          projectName: true,
        },
      },
    },
    orderBy: {
      project: {
        projectName: "asc",
      },
    },
  },
} as const;

const mapUserAuthPayload = (user: {
  email: string;
  username: string;
  createdAt: Date;
  organizationId: string | null;
  organizationRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  organization: {
    orgName: string;
    _count: {
      projects: number;
    };
  } | null;
  projectMembers: Array<{
    role: "ADMIN" | "MEMBER" | "VIEWER";
    project: {
      id: string;
      projectName: string;
    };
  }>;
}) => ({
  email: user.email,
  username: user.username,
  joinedOn: user.createdAt.toISOString(),
  organizationId: user.organizationId,
  organizationRole: user.organizationRole,
  organizationName: user.organization?.orgName ?? null,
  organizationProjectCount: user.organization?._count.projects ?? 0,
  projects: user.projectMembers.map((membership) => ({
    projectId: membership.project.id,
    projectName: membership.project.projectName,
    role: membership.role,
  })),
});

export const createUserInDefaultWorkspace = async (input: {
  username: string;
  email: string;
  passwordHash: string;
}) => {
  const defaultProject = await prisma.project.findFirst({
    where: { isDefault: true },
    select: { id: true, organizationId: true },
  });

  if (!defaultProject) {
    throw new ApiError(
      500,
      "Default project is not configured. Please contact the administrator.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        isPrivacyPolicyAccepted: true,
        organizationId: defaultProject.organizationId,
        organizationRole: "ADMIN",
      },
      select: { id: true, organizationId: true },
    });

    await tx.projectMember.create({
      data: {
        userId: user.id,
        projectId: defaultProject.id,
        role: "ADMIN",
      },
    });

    return user;
  });
};

export const getUserAuthPayload = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAuthSelect,
  });

  if (!user) return null;

  return mapUserAuthPayload(user);
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

export const updateUserProfile = async (userId: string, username: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  const user = await getUserAuthPayload(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const deleteUserAccount = async (userId: string) => {
  const ownedOrganization = await prisma.organization.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (ownedOrganization) {
    throw new ApiError(
      403,
      "Delete or transfer your organization before deleting your account",
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });
};
