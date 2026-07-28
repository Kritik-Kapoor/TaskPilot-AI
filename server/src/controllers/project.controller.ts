import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import type {
  CreateProjectInput,
  ProjectIdParams,
  UpdateProjectInput,
  UpdateProjectMemberBody,
  UpdateProjectMemberParams,
} from "../schemas/project.schema.js";
import {
  canCreateOrgProjects,
  canUpdateProjectDetails,
  createProjectWithMembership,
  DUPLICATE_PROJECT_NAME_MESSAGE,
  findConflictingProject,
  findProjectInOrg,
  getOrgMember,
  getProjectMembership,
  isDuplicateProjectNameError,
  updateProjectDetails,
} from "../services/project.service.js";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.validated!.body as CreateProjectInput;
    const { userId, orgId } = req.user!;

    if (!userId || !orgId)
      return new ApiResponse(401, null, "Unauthorized").send(res);

    const user = await getOrgMember(userId, orgId);

    if (!canCreateOrgProjects(user?.organizationRole)) {
      return new ApiResponse(
        403,
        null,
        "Only organization owners or admins can create projects",
      ).send(res);
    }

    const conflictingProject = await findConflictingProject(orgId, name);

    if (conflictingProject)
      return new ApiResponse(409, null, DUPLICATE_PROJECT_NAME_MESSAGE).send(
        res,
      );

    const project = await createProjectWithMembership(
      orgId,
      userId,
      name,
      description ?? null,
    );

    return new ApiResponse(
      200,
      { project },
      "Project created successfully",
    ).send(res);
  } catch (error) {
    if (isDuplicateProjectNameError(error)) {
      return new ApiResponse(409, null, DUPLICATE_PROJECT_NAME_MESSAGE).send(
        res,
      );
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

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
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

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
    const { userId, orgId } = req.user!;
    const { projectId } = req.validated!.params as ProjectIdParams;
    const body = req.validated!.body as UpdateProjectInput;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const [user, projectMembership, existingProject] = await Promise.all([
      getOrgMember(userId, orgId),
      getProjectMembership(userId, projectId),
      findProjectInOrg(projectId, orgId),
    ]);

    if (
      !canUpdateProjectDetails(user?.organizationRole, projectMembership?.role)
    ) {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to update this project",
      ).send(res);
    }

    if (!existingProject) {
      return new ApiResponse(404, null, "Project not found").send(res);
    }

    const { name, description } = body;

    if (name !== undefined) {
      const conflictingProject = await findConflictingProject(
        orgId,
        name,
        projectId,
      );

      if (conflictingProject) {
        return new ApiResponse(409, null, DUPLICATE_PROJECT_NAME_MESSAGE).send(
          res,
        );
      }
    }

    const project = await updateProjectDetails(
      projectId,
      orgId,
      {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      existingProject,
    );

    return new ApiResponse(200, project, "Project updated successfully").send(
      res,
    );
  } catch (error) {
    if (isDuplicateProjectNameError(error)) {
      return new ApiResponse(409, null, DUPLICATE_PROJECT_NAME_MESSAGE).send(
        res,
      );
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, action } = req.validated!
      .params as UpdateProjectMemberParams;
    const { userToUpdateId, role: assignRole } = req.validated!
      .body as UpdateProjectMemberBody;
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

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
