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

export const assertCanManageOrg = async (orgId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      organizationId: true,
      organizationRole: true,
    },
  });

  if (!user || user.organizationId !== orgId) {
    throw new ApiError(403, "You are not a member of this org");
  }

  if (user.organizationRole !== "OWNER" && user.organizationRole !== "ADMIN") {
    throw new ApiError(403, "Only org admins can manage join requests");
  }

  return user;
};

export const getIncomingJoinRequests = async (
  orgId: string,
  userId: string,
) => {
  await assertCanManageOrg(orgId, userId);

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
  await assertCanManageOrg(orgId, reviewerId);

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
    throw new ApiError(400, "This user already belongs to an organization");
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

const mapOrganizationUser = (
  user: {
    id: string;
    username: string;
    email: string;
    organizationRole: "OWNER" | "ADMIN" | "MEMBER" | null;
    projectMembers: Array<{
      role: "ADMIN" | "MEMBER" | "VIEWER";
      project: {
        id: string;
        projectName: string;
      };
    }>;
  },
  ownerId: string,
) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  organizationRole: user.organizationRole,
  isOwner: user.id === ownerId,
  projects: user.projectMembers.map((membership) => ({
    projectId: membership.project.id,
    projectName: membership.project.projectName,
    role: membership.role,
  })),
});

export const getOrganizationUsers = async (orgId: string, actorId: string) => {
  await assertCanManageOrg(orgId, actorId);

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerId: true },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      username: true,
      email: true,
      organizationRole: true,
      projectMembers: {
        where: {
          project: { organizationId: orgId },
        },
        select: {
          role: true,
          project: {
            select: {
              id: true,
              projectName: true,
            },
          },
        },
      },
    },
    orderBy: { username: "asc" },
  });

  return users.map((user) => mapOrganizationUser(user, organization.ownerId));
};

export const updateOrganizationUser = async (
  orgId: string,
  actorId: string,
  userId: string,
  input: { organizationRole: "ADMIN" | "MEMBER"; projectIds: string[] },
) => {
  const { organizationRole: actorRole } = await assertCanManageOrg(
    orgId,
    actorId,
  );

  const isActorOwner = actorRole === "OWNER";

  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { ownerId: true },
  });

  if (!organization) throw new ApiError(404, "Organization not found");

  if (userId === organization.ownerId) {
    throw new ApiError(403, "Org owner settings cannot be changed here");
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: { id: true, organizationRole: true },
  });

  if (!targetUser) throw new ApiError(404, "User not found in this org");

  if (!isActorOwner) {
    if (targetUser.organizationRole !== "MEMBER") {
      throw new ApiError(403, "Admins can only manage members");
    }

    if (input.organizationRole !== "MEMBER") {
      throw new ApiError(403, "Admins cannot update org level roles");
    }
  }

  const validProjectCount = await prisma.project.count({
    where: {
      organizationId: orgId,
      id: { in: input.projectIds },
    },
  });

  if (validProjectCount !== input.projectIds.length) {
    throw new ApiError(400, "One or more projects are invalid");
  }

  await prisma.$transaction(async (tx) => {
    if (isActorOwner) {
      await tx.user.update({
        where: { id: userId },
        data: { organizationRole: input.organizationRole },
      });
    }

    const existingMemberships = await tx.projectMember.findMany({
      where: {
        userId,
        project: { organizationId: orgId },
      },
      select: { projectId: true },
    });

    const existingProjectIds = new Set(
      existingMemberships.map((membership) => membership.projectId),
    );
    const nextProjectIds = new Set(input.projectIds);

    const projectIdsToRemove = [...existingProjectIds].filter(
      (projectId) => !nextProjectIds.has(projectId),
    );
    const projectIdsToAdd = [...nextProjectIds].filter(
      (projectId) => !existingProjectIds.has(projectId),
    );

    if (projectIdsToRemove.length > 0) {
      await tx.projectMember.deleteMany({
        where: {
          userId,
          projectId: { in: projectIdsToRemove },
        },
      });
    }

    if (projectIdsToAdd.length > 0) {
      await tx.projectMember.createMany({
        data: projectIdsToAdd.map((projectId) => ({
          userId,
          projectId,
          role: "MEMBER" as const,
        })),
      });
    }
  });

  const updatedUser = await prisma.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: {
      id: true,
      username: true,
      email: true,
      organizationRole: true,
      projectMembers: {
        where: {
          project: { organizationId: orgId },
        },
        select: {
          role: true,
          project: {
            select: {
              id: true,
              projectName: true,
            },
          },
        },
      },
    },
  });

  if (!updatedUser) {
    throw new ApiError(404, "User not found after update");
  }

  return mapOrganizationUser(updatedUser, organization.ownerId);
};
