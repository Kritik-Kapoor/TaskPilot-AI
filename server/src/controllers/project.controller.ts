import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import { ensureOrgOwnerIsProjectAdmin } from "../utils/projectMember.utils.js";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const { userId, orgId } = req.user!;

    if (!userId || !orgId)
      return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!name) return new ApiResponse(400, null, "Name is required").send(res);

    const project = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          projectName: name,
          description,
          organizationId: orgId,
        },
      });

      await tx.projectMember.create({
        data: {
          userId,
          projectId: project.id,
          role: "ADMIN",
        },
      });

      await ensureOrgOwnerIsProjectAdmin(tx, orgId, project.id);

      return project;
    });

    return new ApiResponse(
      200,
      { project },
      "Project created successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!projectId)
      return new ApiResponse(400, null, "Project ID is required").send(res);

    const project = await prisma.project.findFirst({
      where: { id: projectId },
      select: {
        id: true,
        projectName: true,
        description: true,
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!project)
      return new ApiResponse(404, null, "Project not found").send(res);

    return new ApiResponse(200, project, "Project fetched successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!projectId)
      return new ApiResponse(400, null, "Project ID is required").send(res);

    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: { role: true },
    });

    if (membership?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to delete this project",
      ).send(res);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return new ApiResponse(200, null, "Project deleted successfully").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { name, description } = req.body as {
      name?: string;
      description?: string;
    };
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!projectId)
      return new ApiResponse(400, null, "Project ID is required").send(res);
    if (!name && !description)
      return new ApiResponse(400, null, "Name or description is required").send(
        res,
      );

    const userRole = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: { role: true },
    });

    if (userRole?.role !== "ADMIN")
      return new ApiResponse(
        403,
        null,
        "You are not authorized to update this project",
      ).send(res);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: req.body,
    });

    return new ApiResponse(200, project, "Project updated successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, action } = req.params as {
      projectId: string;
      action: string;
    };
    const { userToUpdateId, role: assignRole } = req.body as {
      userToUpdateId?: string;
      role?: "ADMIN" | "MEMBER" | "VIEWER";
    };
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);
    if (!projectId)
      return new ApiResponse(400, null, "Project ID is required").send(res);

    if (!["add", "remove", "update"].includes(action))
      return new ApiResponse(400, null, "Invalid action").send(res);
    if (!userToUpdateId)
      return new ApiResponse(400, null, "User ID is required").send(res);

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      select: {
        id: true,
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!project)
      return new ApiResponse(404, null, "Project not found").send(res);

    const actorMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: { role: true },
    });

    const memberSelect = {
      id: true,
      role: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    } as const;

    if (action === "add") {
      if (actorMembership?.role !== "ADMIN")
        return new ApiResponse(
          403,
          null,
          "Only project admins can add members",
        ).send(res);

      const targetUser = await prisma.user.findFirst({
        where: {
          id: userToUpdateId,
          organizationId: orgId,
        },
        select: { id: true },
      });

      if (!targetUser)
        return new ApiResponse(
          403,
          null,
          "Target user is not a member of this organization",
        ).send(res);

      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId: userToUpdateId, projectId },
        },
      });

      if (existingMember)
        return new ApiResponse(
          400,
          null,
          "User is already a member of this project",
        ).send(res);

      const projectMember = await prisma.projectMember.create({
        data: {
          userId: userToUpdateId,
          projectId,
          ...(assignRole && { role: assignRole }),
        },
        select: memberSelect,
      });

      return new ApiResponse(
        200,
        projectMember,
        "Project member added successfully",
      ).send(res);
    }

    if (action === "remove") {
      if (actorMembership?.role !== "ADMIN")
        return new ApiResponse(
          403,
          null,
          "Only project admins can remove members",
        ).send(res);

      if (userToUpdateId === project.organization.ownerId)
        return new ApiResponse(
          403,
          null,
          "Organization owner cannot be removed from a project",
        ).send(res);

      await prisma.projectMember.delete({
        where: {
          userId_projectId: { userId: userToUpdateId, projectId },
        },
      });

      return new ApiResponse(
        200,
        null,
        "Project member removed successfully",
      ).send(res);
    }

    if (!assignRole)
      return new ApiResponse(400, null, "Role is required").send(res);

    if (actorMembership?.role !== "ADMIN")
      return new ApiResponse(
        403,
        null,
        "Only project admins can update member roles",
      ).send(res);

    if (userToUpdateId === project.organization.ownerId)
      return new ApiResponse(
        403,
        null,
        "Organization owner must remain a project admin",
      ).send(res);

    const targetMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: userToUpdateId, projectId },
      },
    });

    if (!targetMember)
      return new ApiResponse(404, null, "Project member not found").send(res);

    const projectMember = await prisma.projectMember.update({
      where: {
        userId_projectId: { userId: userToUpdateId, projectId },
      },
      data: { role: assignRole },
      select: memberSelect,
    });

    return new ApiResponse(
      200,
      projectMember,
      "Project member updated successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
