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
