import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import { issueAuthTokens } from "../utils/generateToken.js";
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from "../schemas/organization.schema.js";
import {
  createOrganizationTransaction,
  findConflictingOrganization,
  findOrganizationByName,
  normalizeOrgName,
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
            email: true,
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
            email: true,
            organizationRole: true,
          },
          orderBy: { username: "asc" },
        },
        projects: {
          select: {
            id: true,
            projectName: true,
            description: true,
            members: {
              select: {
                user: {
                  select: {
                    username: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!organization)
      return new ApiResponse(404, null, "Organization not found").send(res);

    const memberPreviewByProjectId = organization.projects
      .flatMap((project) =>
        project.members.map((member) => ({
          projectId: project.id,
          user: member.user,
        })),
      )
      .reduce<Record<string, Array<{ username: string }>>>((acc, member) => {
        const preview = acc[member.projectId] ?? [];

        if (preview.length < 4) {
          preview.push({
            username: member.user.username,
          });
          acc[member.projectId] = preview;
        }

        return acc;
      }, {});

    const organizationWithProjectSummaries = {
      ...organization,
      projects: organization.projects.map(({ members, ...project }) => ({
        ...project,
        memberCount: members.length,
        memberPreview: memberPreviewByProjectId[project.id] ?? [],
      })),
    };

    return new ApiResponse(
      200,
      organizationWithProjectSummaries,
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
        isDefault: true,
        _count: {
          select: { members: true, tickets: true },
        },
        members: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                username: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const memberPreviewByProjectId = projects
      .flatMap((project) =>
        project.members.map((member) => ({
          projectId: project.id,
          user: member.user,
        })),
      )
      .reduce<Record<string, Array<{ username: string }>>>((acc, member) => {
        const preview = acc[member.projectId] ?? [];

        if (preview.length < 4) {
          preview.push({
            username: member.user.username,
          });
          acc[member.projectId] = preview;
        }

        return acc;
      }, {});

    const projectsWithMembership = projects.map(
      ({ members, _count, ...project }) => {
        const userMembership = members.find(
          (member) => member.userId === userId,
        );

        return {
          ...project,
          memberCount: _count.members,
          ticketCount: _count.tickets,
          memberPreview: memberPreviewByProjectId[project.id] ?? [],
          isJoined: Boolean(userMembership),
          role: userMembership?.role ?? null,
        };
      },
    );

    return new ApiResponse(
      200,
      projectsWithMembership,
      "Projects list fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
