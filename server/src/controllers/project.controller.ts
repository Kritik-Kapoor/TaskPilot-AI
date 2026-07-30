import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import type {
  CreateLabelBody,
  CreateProjectInput,
  ProjectIdParams,
  UpdateLabelParams,
  UpdateProjectInput,
  UpdateProjectMemberBody,
  UpdateProjectMemberParams,
} from "../schemas/project.schema.js";
import {
  canCreateOrgProjects,
  canUpdateProjectDetails,
  createProjectWithMembership,
  DUPLICATE_LABEL_NAME_MESSAGE,
  DUPLICATE_PROJECT_NAME_MESSAGE,
  findConflictingProject,
  findProjectInOrg,
  getOrgMember,
  getProjectMembership,
  isDuplicateNameError,
  updateProjectDetails,
} from "../services/project.service.js";
import { GetUserRoleInProjectInput } from "../schemas/auth.schema.js";

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
    if (isDuplicateNameError(error)) {
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
    if (isDuplicateNameError(error)) {
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

export const getUserRoleInProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as GetUserRoleInProjectInput;
    const { userId, orgId } = req.user!;

    if (!orgId)
      return new ApiResponse(
        401,
        null,
        "Not authorized, not part of the organization",
      ).send(res);

    const projectMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { role: true },
    });

    if (!projectMember)
      return new ApiResponse(404, null, "User not found in project").send(res);

    return new ApiResponse(
      200,
      projectMember.role,
      "User role fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    const members = projectMembers.map(({ role, user }) => ({
      role,
      id: user.id,
      username: user.username,
    }));

    return new ApiResponse(
      200,
      members,
      "Project members fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProjectBoardColumns = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;

    const boardColumns = await prisma.boardColumn.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        color: true,
        position: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return new ApiResponse(
      200,
      boardColumns,
      "Project board columns fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const createLabel = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { name, color } = req.validated!.body as CreateLabelBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role === "VIEWER") {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to create labels in this project",
      ).send(res);
    }

    const newLabel = await prisma.label.create({
      data: {
        name,
        color,
        projectId,
      },
    });

    return new ApiResponse(200, newLabel, "Label created successfully").send(
      res,
    );
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return new ApiResponse(409, null, DUPLICATE_LABEL_NAME_MESSAGE).send(res);
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateLabel = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, labelId } = req.validated!.params as UpdateLabelParams;
    const body = req.validated!.body as CreateLabelBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role === "VIEWER") {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to update labels in this project",
      ).send(res);
    }

    const updatedLabel = await prisma.label.update({
      where: { id: labelId, projectId },
      data: body,
    });

    return new ApiResponse(
      200,
      updatedLabel,
      "Label updated successfully",
    ).send(res);
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return new ApiResponse(409, null, DUPLICATE_LABEL_NAME_MESSAGE).send(res);
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getLabels = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;

    const labels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true, color: true },
    });

    return new ApiResponse(200, labels, "Labels fetched successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
