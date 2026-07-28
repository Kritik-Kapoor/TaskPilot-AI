import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import { issueAuthTokens } from "../utils/generateToken.js";
import { ensureUserIsProjectAdminOnAllOrgProjects } from "../utils/projectMember.utils.js";
import type {
  CheckOrganizationNameQuery,
  CreateOrganizationInput,
  OrganizationIdParams,
  SearchOrganizationsQuery,
  TransferOwnershipParams,
  UpdateOrganizationInput,
} from "../schemas/organization.schema.js";
import {
  createOrganizationTransaction,
  findConflictingOrganization,
  findOrganizationByName,
  mapOrganizationSummary,
  mapJoinRequestSummary,
  normalizeOrgName,
  searchDiscoverableOrganizations,
  getUserJoinRequests,
} from "../services/organization.service.js";

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orgName, description } = req.validated!
      .body as CreateOrganizationInput;

    const [user, conflictingOrganization] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          organizationId: true,
          organizationRole: true,
        },
      }),
      findOrganizationByName(orgName),
    ]);

    if (!user) return new ApiResponse(404, null, "User not found").send(res);

    const userOrgId = user.organizationId;

    const isConflictingWithAnotherOrg =
      conflictingOrganization && conflictingOrganization.id !== userOrgId;

    // No org yet and no conflict
    if (!userOrgId && !conflictingOrganization) {
      const organization = await createOrganizationTransaction(
        orgName,
        description ?? null,
        userId,
      );

      issueAuthTokens(res, { userId, orgId: organization.id });

      return new ApiResponse(
        201,
        organization,
        "Organization created successfully",
      ).send(res);
    }

    if (!userOrgId && conflictingOrganization) {
      return new ApiResponse(
        409,
        null,
        "Organization name is already taken",
      ).send(res);
    }

    // Already in an org and not an owner
    if (user.organizationRole !== "OWNER") {
      return new ApiResponse(
        403,
        null,
        "Only the organization owner can update organization details.",
      ).send(res);
    }

    if (isConflictingWithAnotherOrg) {
      return new ApiResponse(
        409,
        null,
        "Organization name is already taken",
      ).send(res);
    }

    const organization = await prisma.organization.update({
      where: { id: userOrgId! },
      data: {
        orgName: normalizeOrgName(orgName),
        description: description ?? null,
      },
      select: {
        id: true,
        orgName: true,
      },
    });

    issueAuthTokens(res, { userId, orgId: organization.id });

    return new ApiResponse(
      200,
      organization,
      "Organization updated successfully",
    ).send(res);
  } catch (error) {
    if (error instanceof ApiError) return error.send(res);
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getOrganization = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.user!;
    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        orgName: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          select: {
            id: true,
            username: true,
            organizationRole: true,
          },
        },
        projects: {
          select: {
            id: true,
            projectName: true,
            description: true,
            members: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
                role: true,
              },
            },
          },
        },
      },
    });

    if (!organization)
      return new ApiResponse(404, null, "Organization not found").send(res);

    return new ApiResponse(
      200,
      organization,
      "Organization fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { orgName, description } = req.validated!
      .body as UpdateOrganizationInput;
    const { orgId, userId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const membership = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationRole: true },
    });

    if (membership?.organizationRole === "MEMBER") {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to update this organization",
      ).send(res);
    }

    if (orgName) {
      const conflictingOrganization = await findConflictingOrganization(
        orgName,
        orgId,
      );

      if (conflictingOrganization) {
        return new ApiResponse(
          409,
          null,
          "An organization with this name already exists",
        ).send(res);
      }
    }

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(orgName !== undefined && { orgName: normalizeOrgName(orgName) }),
        ...(description !== undefined && { description }),
      },
    });

    return new ApiResponse(
      200,
      organization,
      "Organization updated successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const transferOwnership = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.user!;
    const { newOwnerId } = req.validated!.params as TransferOwnershipParams;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    if (newOwnerId === userId)
      return new ApiResponse(400, null, "You are already the owner").send(res);

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    });

    if (!organization)
      return new ApiResponse(404, null, "Organization not found").send(res);

    if (organization.ownerId !== userId)
      return new ApiResponse(
        403,
        null,
        "You are not authorized to transfer ownership of this organization",
      ).send(res);

    const newOwner = await prisma.user.findFirst({
      where: {
        id: newOwnerId,
        organizationId: orgId,
      },
      select: { organizationRole: true },
    });

    if (!newOwner)
      return new ApiResponse(
        404,
        null,
        "User is not a member of this organization",
      ).send(res);

    if (newOwner.organizationRole !== "ADMIN")
      return new ApiResponse(
        403,
        null,
        "Ownership can only be transferred to an admin",
      ).send(res);

    const updatedOrganization = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { organizationRole: "ADMIN" },
      });

      await tx.user.update({
        where: { id: newOwnerId },
        data: { organizationRole: "OWNER" },
      });

      await ensureUserIsProjectAdminOnAllOrgProjects(tx, orgId, newOwnerId);

      return tx.organization.update({
        where: { id: orgId },
        data: { ownerId: newOwnerId },
        select: {
          id: true,
          orgName: true,
          owner: {
            select: {
              username: true,
            },
          },
        },
      });
    });

    return new ApiResponse(
      200,
      updatedOrganization,
      `${updatedOrganization.owner.username} is now the owner of this organization`,
    ).send(res);
  } catch (error) {
    return new ApiError(500, "Internal server error").send(res);
  }
};

export const searchOrganizations = async (req: Request, res: Response) => {
  try {
    const { q } = req.validated!.query as SearchOrganizationsQuery;
    const query = q?.trim();

    if (!query) {
      return new ApiResponse(
        200,
        [],
        "Organizations fetched successfully",
      ).send(res);
    }

    const organizations = await searchDiscoverableOrganizations(query);

    return new ApiResponse(
      200,
      organizations.map(mapOrganizationSummary),
      "Organizations fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const checkOrganizationName = async (req: Request, res: Response) => {
  try {
    const { name } = req.validated!.query as CheckOrganizationNameQuery;

    if (!name)
      return new ApiResponse(200, null, "Organization name is available").send(
        res,
      );

    const organization = await findOrganizationByName(name);

    if (organization && req.user?.orgId === organization.id)
      return new ApiResponse(200, null, "Organization name is available").send(
        res,
      );

    return new ApiResponse(
      200,
      organization ? mapOrganizationSummary(organization) : null,
      organization
        ? "Organization name is already taken"
        : "Organization name is available",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getMyJoinRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const joinRequests = await getUserJoinRequests(userId);

    return new ApiResponse(
      200,
      joinRequests.map(mapJoinRequestSummary),
      "Join requests fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const joinRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orgId: organizationId } = req.validated!
      .params as OrganizationIdParams;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (user?.organizationId)
      return new ApiResponse(
        400,
        null,
        "You are already part of an organization",
      ).send(res);

    const organization = await prisma.organization.findFirst({
      where: { id: organizationId },
      select: {
        id: true,
        orgName: true,
      },
    });

    if (!organization)
      return new ApiResponse(404, null, "Organization not found").send(res);

    const pendingRequest = await prisma.organizationJoinRequest.findFirst({
      where: {
        userId,
        organizationId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (pendingRequest) {
      return new ApiResponse(
        409,
        null,
        "You already have a pending join request for this organization",
      ).send(res);
    }

    await prisma.organizationJoinRequest.create({
      data: {
        userId,
        organizationId,
      },
    });

    return new ApiResponse(
      200,
      organization,
      "Join request sent successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProjectsList = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.user!;
    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const projects = await prisma.project.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        projectName: true,
        projectKey: true,
        description: true,
        members: {
          where: { userId },
          select: { role: true },
          take: 1,
        },
      },
    });

    const projectsWithMembership = projects.map(({ members, ...project }) => ({
      ...project,
      isJoined: members.length > 0,
      role: members[0]?.role ?? null,
    }));

    return new ApiResponse(
      200,
      projectsWithMembership,
      "Projects list fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.user!;
    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const membership = await prisma.organization.findUnique({
      where: {
        id: orgId,
      },
      select: { ownerId: true },
    });

    if (membership?.ownerId !== userId)
      return new ApiResponse(
        403,
        null,
        "You are not authorized to delete this organization",
      ).send(res);

    await prisma.organization.delete({
      where: { id: orgId },
    });

    return new ApiResponse(200, null, "Organization deleted successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
