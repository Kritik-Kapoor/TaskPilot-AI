import { Request, Response } from "express";
import {
  ApiError,
  ApiResponse,
  getErrorMessage,
} from "../utils/apiResponse.js";
import { prisma } from "../config/db.js";
import type {
  BoardColumnParams,
  BoardColumnBody,
  CreateIssueTypeBody,
  CreateLabelBody,
  CreateProjectInput,
  PatchProjectMemberBody,
  ProjectIdParams,
  ProjectMemberUserIdParams,
  ReorderBoardColumnsBody,
  UpdateLabelParams,
  UpdateProjectDefaultParams,
  UpdateProjectInput,
  UpdateProjectMemberBody,
  UpdateProjectMemberParams,
  UpdateIssueTypeBody,
  UpdateIssueTypeParams,
} from "../schemas/project.schema.js";
import {
  canCreateOrgProjects,
  canUpdateProjectDetails,
  createProjectWithMembership,
  joinDefaultProject as joinDefaultProjectService,
  DUPLICATE_LABEL_NAME_MESSAGE,
  DUPLICATE_PROJECT_NAME_MESSAGE,
  findConflictingProject,
  findProjectInOrg,
  getOrgMember,
  getProjectMembership,
  isDuplicateNameError,
  normalizeProjectMemberObject,
  setProjectDefaultStatus,
  updateProjectDetails,
} from "../services/project.service.js";
import {
  createIssueType as createIssueTypeService,
  getIssueTypesWithCounts,
} from "../services/ticketType.service.js";
import { TicketServiceError } from "../services/ticket.service.js";
import { getWorkspaceUser } from "../middlewares/authenticateWorkspaceUser.middleware.js";
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

    const project = await findProjectInOrg(projectId, orgId);

    if (!project)
      return new ApiResponse(404, null, "Project not found").send(res);

    if (project.isDefault) {
      return new ApiResponse(
        403,
        null,
        "This is a demo project and cannot be deleted",
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

export const updateProjectDefaultStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { projectId, isDefault } = req.validated!
      .params as UpdateProjectDefaultParams;
    const { userId, orgId } = getWorkspaceUser(req);

    const project = await setProjectDefaultStatus(
      orgId,
      userId,
      projectId,
      isDefault,
    );

    return new ApiResponse(
      200,
      project,
      isDefault
        ? "Project marked as default"
        : "Project is no longer the default project",
    ).send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiResponse(error.statusCode, null, error.message).send(res);
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
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    const membership = await getProjectMembership(userId, projectId);

    if (!membership) {
      return new ApiResponse(
        403,
        null,
        "You are not a member of this project",
      ).send(res);
    }

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: { username: "asc" },
      },
    });

    const members = projectMembers.map(({ role, user }) => ({
      role,
      id: user.id,
      username: user.username,
      email: user.email,
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

export const patchProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, userId: userToUpdateId } = req.validated!
      .params as ProjectMemberUserIdParams;
    const { username, role } = req.validated!.body as PatchProjectMemberBody;
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

    if (!project) {
      return new ApiResponse(404, null, "Project not found").send(res);
    }

    const actorMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: { role: true },
    });

    if (actorMembership?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can update members",
      ).send(res);
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: userToUpdateId, projectId },
      },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!targetMember) {
      return new ApiResponse(404, null, "Project member not found").send(res);
    }

    if (targetMember.user.organizationId !== orgId) {
      return new ApiResponse(
        403,
        null,
        "Target user is not a member of this organization",
      ).send(res);
    }

    if (
      userToUpdateId === project.organization.ownerId &&
      role &&
      role !== "ADMIN"
    ) {
      return new ApiResponse(
        403,
        null,
        "Organization owner must remain a project admin",
      ).send(res);
    }

    const updatedMember = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userToUpdateId },
        data: { username },
      });

      return await tx.projectMember.update({
        where: {
          userId_projectId: { userId: userToUpdateId, projectId },
        },
        data: { role },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    return new ApiResponse(
      200,
      normalizeProjectMemberObject(updatedMember),
      "Project member updated successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteProjectMember = async (req: Request, res: Response) => {
  try {
    const { projectId, userId: userToUpdateId } = req.validated!
      .params as ProjectMemberUserIdParams;
    const { userId, orgId } = req.user!;

    if (!orgId) return new ApiResponse(401, null, "Unauthorized").send(res);

    if (userToUpdateId === userId) {
      return new ApiResponse(
        400,
        null,
        "You cannot remove yourself from the project",
      ).send(res);
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId: orgId },
      select: {
        id: true,
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!project) {
      return new ApiResponse(404, null, "Project not found").send(res);
    }

    const actorMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
      select: { role: true },
    });

    if (actorMembership?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can remove members",
      ).send(res);
    }

    if (userToUpdateId === project.organization.ownerId) {
      return new ApiResponse(
        403,
        null,
        "Organization owner cannot be removed from a project",
      ).send(res);
    }

    const targetMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: userToUpdateId, projectId },
      },
      select: { id: true },
    });

    if (!targetMember) {
      return new ApiResponse(404, null, "Project member not found").send(res);
    }

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
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    return new ApiResponse(
      200,
      boardColumns.map(({ _count, ...column }) => ({
        ...column,
        ticketCount: _count.tickets,
      })),
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

export const deleteLabel = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, labelId } = req.validated!.params as UpdateLabelParams;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role === "VIEWER") {
      return new ApiResponse(
        403,
        null,
        "You are not authorized to delete labels in this project",
      ).send(res);
    }

    await prisma.label.delete({
      where: { id: labelId, projectId },
    });

    return new ApiResponse(200, null, "Label deleted successfully").send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getProjectTicketTypes = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;
    const issueTypes = await getIssueTypesWithCounts(projectId);

    return new ApiResponse(
      200,
      issueTypes,
      "Issue types fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateIssueType = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, typeId } = req.validated!
      .params as UpdateIssueTypeParams;
    const body = req.validated!.body as UpdateIssueTypeBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can update issue types",
      ).send(res);
    }

    const updatedType = await prisma.issueType.update({
      where: { id: typeId, projectId },
      data: {
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(body.key !== undefined && { key: body.key.toLowerCase() }),
        ...(body.color !== undefined && { color: body.color }),
      },
      select: {
        id: true,
        key: true,
        color: true,
        isEnabled: true,
        _count: { select: { tickets: true } },
      },
    });

    const { _count, ...rest } = updatedType;

    return new ApiResponse(
      200,
      { ...rest, ticketCount: _count.tickets },
      "Issue type updated successfully",
    ).send(res);
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return new ApiResponse(
        409,
        null,
        "An issue type with that key already exists",
      ).send(res);
    }
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const createIssueType = async (req: Request, res: Response) => {
  try {
    const { userId, orgId } = getWorkspaceUser(req);
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { key, color } = req.validated!.body as CreateIssueTypeBody;

    const newType = await createIssueTypeService(orgId, userId, projectId, {
      key,
      color,
    });

    return new ApiResponse(
      201,
      newType,
      "Issue type created successfully",
    ).send(res);
  } catch (error) {
    if (error instanceof TicketServiceError) {
      return new ApiResponse(error.statusCode, null, error.message).send(res);
    }
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteIssueType = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, typeId } = req.validated!
      .params as UpdateIssueTypeParams;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can delete issue types",
      ).send(res);
    }

    await prisma.issueType.delete({ where: { id: typeId, projectId } });

    return new ApiResponse(200, null, "Issue type deleted successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const createBoardColumn = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { name, color } = req.validated!.body as BoardColumnBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can create board columns",
      ).send(res);
    }

    if (name.trim().toLowerCase() === "backlog") {
      return new ApiResponse(400, null, '"Backlog" column already exists').send(
        res,
      );
    }

    const last = await prisma.boardColumn.findFirst({
      where: { projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (last?.position ?? 0) + 1000;

    const newColumn = await prisma.boardColumn.create({
      data: { name: name.trim(), color, projectId, position },
      select: {
        id: true,
        name: true,
        color: true,
        position: true,
        _count: { select: { tickets: true } },
      },
    });

    const { _count, ...rest } = newColumn;

    return new ApiResponse(
      201,
      { ...rest, ticketCount: _count.tickets },
      "Board column created successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const updateBoardColumn = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, columnId } = req.validated!.params as BoardColumnParams;
    const body = req.validated!.body as BoardColumnBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can update board columns",
      ).send(res);
    }

    const existing = await prisma.boardColumn.findUnique({
      where: { id: columnId, projectId },
      select: { name: true },
    });

    if (!existing) {
      return new ApiResponse(404, null, "Column not found").send(res);
    }

    const isBacklog = existing.name.toLowerCase() === "backlog";

    if (isBacklog) {
      return new ApiResponse(400, null, "Cannot update backlog column").send(
        res,
      );
    }

    if (body.name?.trim().toLowerCase() === "backlog") {
      return new ApiResponse(
        400,
        null,
        '"Backlog" column already exists"',
      ).send(res);
    }

    const updated = await prisma.boardColumn.update({
      where: { id: columnId, projectId },
      data: {
        name: body.name.trim(),
        color: body.color,
      },
      select: {
        id: true,
        name: true,
        color: true,
        position: true,
        _count: { select: { tickets: true } },
      },
    });

    const { _count, ...rest } = updated;

    return new ApiResponse(
      200,
      { ...rest, ticketCount: _count.tickets },
      "Board column updated successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const deleteBoardColumn = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId, columnId } = req.validated!.params as BoardColumnParams;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      return new ApiResponse(
        403,
        null,
        "Only project admins can delete board columns",
      ).send(res);
    }

    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId, projectId },
      select: { name: true, _count: { select: { tickets: true } } },
    });

    if (!column) {
      return new ApiResponse(404, null, "Column not found").send(res);
    }

    if (column.name.toLowerCase() === "backlog") {
      return new ApiResponse(
        400,
        null,
        '"Backlog" column cannot be deleted',
      ).send(res);
    }

    if (column._count.tickets > 0) {
      return new ApiResponse(
        400,
        null,
        `Move the ${column._count.tickets} ticket(s) out of this column before deleting it`,
      ).send(res);
    }

    await prisma.boardColumn.delete({ where: { id: columnId, projectId } });

    return new ApiResponse(200, null, "Board column deleted successfully").send(
      res,
    );
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const reorderBoardColumns = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!;
    const { projectId } = req.validated!.params as ProjectIdParams;
    const { columnId, newPosition } = req.validated!
      .body as ReorderBoardColumnsBody;

    const memberAccess = await getProjectMembership(userId, projectId);

    if (memberAccess?.role !== "ADMIN") {
      const user = await getOrgMember(userId, req.user!.orgId!);
      if (!canCreateOrgProjects(user?.organizationRole)) {
        return new ApiResponse(
          403,
          null,
          "Only admins can reorder board columns",
        ).send(res);
      }
    }

    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId, projectId },
      select: { name: true },
    });

    if (!column) {
      return new ApiResponse(404, null, "Column not found").send(res);
    }

    if (column.name.toLowerCase() === "backlog") {
      return new ApiResponse(
        400,
        null,
        "The Backlog column cannot be moved",
      ).send(res);
    }

    const updated = await prisma.boardColumn.update({
      where: { id: columnId, projectId },
      data: { position: newPosition },
      select: { id: true, name: true, color: true, position: true },
    });

    return new ApiResponse(
      200,
      { column: updated },
      "Column moved successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const getLabels = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.validated!.params as ProjectIdParams;

    const labels = await prisma.label.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        color: true,
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return new ApiResponse(
      200,
      labels.map(({ _count, ...label }) => ({
        ...label,
        ticketCount: _count.tickets,
      })),
      "Labels fetched successfully",
    ).send(res);
  } catch (error) {
    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};

export const joinDefaultProject = async (req: Request, res: Response) => {
  try {
    const { userId, orgId } = getWorkspaceUser(req);

    const result = await joinDefaultProjectService(orgId, userId);

    return new ApiResponse(200, result, "Joined the default project").send(res);
  } catch (error) {
    if (error instanceof ApiError) {
      return new ApiResponse(error.statusCode, null, error.message).send(res);
    }

    return new ApiError(500, getErrorMessage(error)).send(res);
  }
};
