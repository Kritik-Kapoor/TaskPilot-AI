import { prisma } from "../config/db.js";
import { ApiError, getErrorMessage } from "../utils/apiResponse.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const normalizeOrgName = (orgName: string) => orgName.toLowerCase();

export const mapOrganizationSummary = (organization: {
  id: string;
  orgName: string;
  _count: { projects: number; members: number };
}) => ({
  id: organization.id,
  orgName: organization.orgName,
  projectCount: organization._count.projects,
  memberCount: organization._count.members,
});

export const findOrganizationByName = (orgName: string) =>
  prisma.organization.findUnique({
    where: { orgName: normalizeOrgName(orgName) },
    select: {
      id: true,
      orgName: true,
      ownerId: true,
      _count: {
        select: {
          projects: true,
          members: true,
        },
      },
    },
  });

export const findConflictingOrganization = (
  orgName: string,
  excludeOrgId: string,
) =>
  prisma.organization.findFirst({
    where: {
      orgName: normalizeOrgName(orgName),
      NOT: { id: excludeOrgId },
    },
    select: { id: true },
  });

export const searchDiscoverableOrganizations = (query: string) =>
  prisma.organization.findMany({
    where: {
      orgName: {
        contains: query,
        mode: "insensitive",
      },
      projects: {
        some: {},
      },
    },
    select: {
      id: true,
      orgName: true,
      _count: {
        select: {
          projects: true,
          members: true,
        },
      },
    },
    orderBy: { orgName: "asc" },
    take: 10,
  });

export const getUserJoinRequests = (userId: string) =>
  prisma.organizationJoinRequest.findMany({
    where: {
      userId,
      status: {
        in: ["PENDING", "DECLINED"],
      },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      organization: {
        select: {
          id: true,
          orgName: true,
          _count: {
            select: {
              projects: true,
              members: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

export const mapJoinRequestSummary = (joinRequest: {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: Date;
  organization: {
    id: string;
    orgName: string;
    _count: { projects: number; members: number };
  };
}) => ({
  id: joinRequest.id,
  status: joinRequest.status,
  createdAt: joinRequest.createdAt.toISOString(),
  organization: mapOrganizationSummary(joinRequest.organization),
});

const incomingJoinRequestSelect = {
  id: true,
  status: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
} as const;

export const mapIncomingJoinRequest = (joinRequest: {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: Date;
  user: {
    id: string;
    username: string;
    email: string;
  };
}) => ({
  id: joinRequest.id,
  status: joinRequest.status,
  requestedOn: joinRequest.createdAt.toISOString(),
  user: joinRequest.user,
});

export const assertCanManageJoinRequests = async (
  orgId: string,
  userId: string,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      organizationRole: true,
    },
  });

  if (!user || user.organizationId !== orgId) {
    throw new ApiError(403, "You are not a member of this organization");
  }

  if (user.organizationRole !== "OWNER" && user.organizationRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only organization admins can manage join requests",
    );
  }

  return user;
};

export const getIncomingJoinRequests = async (orgId: string, userId: string) => {
  await assertCanManageJoinRequests(orgId, userId);

  const joinRequests = await prisma.organizationJoinRequest.findMany({
    where: { organizationId: orgId },
    select: incomingJoinRequestSelect,
    orderBy: { createdAt: "desc" },
  });

  return joinRequests.map(mapIncomingJoinRequest);
};

export const reviewJoinRequest = async (
  orgId: string,
  reviewerId: string,
  requestId: string,
  action: "approve" | "decline",
) => {
  await assertCanManageJoinRequests(orgId, reviewerId);

  const joinRequest = await prisma.organizationJoinRequest.findFirst({
    where: {
      id: requestId,
      organizationId: orgId,
    },
    select: {
      id: true,
      status: true,
      userId: true,
      user: {
        select: {
          id: true,
          organizationId: true,
        },
      },
    },
  });

  if (!joinRequest) {
    throw new ApiError(404, "Join request not found");
  }

  if (joinRequest.status !== "PENDING") {
    throw new ApiError(400, "This join request has already been reviewed");
  }

  if (action === "decline") {
    const updated = await prisma.organizationJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "DECLINED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
      select: incomingJoinRequestSelect,
    });

    return mapIncomingJoinRequest(updated);
  }

  if (joinRequest.user.organizationId) {
    throw new ApiError(
      400,
      "This user already belongs to an organization",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: joinRequest.userId },
      data: {
        organizationId: orgId,
        organizationRole: "MEMBER",
      },
    });

    await tx.organizationJoinRequest.updateMany({
      where: {
        userId: joinRequest.userId,
        status: "PENDING",
        NOT: { id: requestId },
      },
      data: {
        status: "DECLINED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
    });

    return tx.organizationJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
      select: incomingJoinRequestSelect,
    });
  });

  return mapIncomingJoinRequest(updated);
};

export async function createOrganizationTransaction(
  orgName: string,
  description: string | null,
  userId: string,
): Promise<{
  id: string;
  orgName: string;
}> {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (user?.organizationId) {
        throw new ApiError(409, "Already belongs to organization");
      }

      const org = await tx.organization.create({
        data: {
          orgName: normalizeOrgName(orgName),
          description: description ?? null,
          ownerId: userId,
          createdById: userId,
        },
        select: {
          id: true,
          orgName: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          organizationId: org.id,
          organizationRole: "OWNER",
        },
      });

      return org;
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "Organization name is already taken");
    }

    throw new ApiError(500, getErrorMessage(error));
  }
}
