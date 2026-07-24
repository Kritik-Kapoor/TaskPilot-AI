import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import { generateAccessToken } from "../utils/generateToken.js";
import { ensureUserIsProjectAdminOnAllOrgProjects } from "../utils/projectMember.utils.js";

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name } = req.body as { name: string };

    if (!name)
      return new ApiResponse(400, null, "Organization name is required").send(
        res,
      );

    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          orgName: name,
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

    generateAccessToken({ userId, orgId: organization.id }, res);

    return new ApiResponse(
      200,
      { organization },
      "Organization created successfully",
    ).send(res);
  } catch (error) {
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
    const { orgName } = req.body as { orgName: string };
    const { orgId, userId } = req.user!;
    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!orgName)
      return new ApiResponse(400, null, "Organization name is required").send(
        res,
      );

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

    const organization = await prisma.organization.update({
      where: { id: orgId },
      data: req.body,
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
    const { newOwnerId } = req.params as { newOwnerId: string };

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!newOwnerId)
      return new ApiResponse(400, null, "New owner ID is required").send(res);

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

export const getProjectsList = async (req: Request, res: Response) => {
  try {
    const { orgId, userId } = req.user!;
    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const projects = await prisma.project.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        projectName: true,
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
