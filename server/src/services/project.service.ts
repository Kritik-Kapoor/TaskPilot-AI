import { prisma } from "../config/db.js";
import { ensureOrgOwnerIsProjectAdmin } from "../utils/projectMember.utils.js";
import { seedDefaultBoardColumns } from "./boardColumn.service.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const normalizeProjectName = (name: string) => name.toLowerCase();

export const DUPLICATE_PROJECT_NAME_MESSAGE =
  "A project with this name already exists in your organization";

export const DUPLICATE_LABEL_NAME_MESSAGE =
  "A label with this name already exists in this project";

export const isDuplicateNameError = (error: unknown) =>
  error instanceof PrismaClientKnownRequestError && error.code === "P2002";

export const canCreateOrgProjects = (role: string | null | undefined) =>
  role === "OWNER" || role === "ADMIN";

export const canUpdateProjectDetails = (
  organizationRole: string | null | undefined,
  projectRole: string | null | undefined,
) => canCreateOrgProjects(organizationRole) || projectRole === "ADMIN";

export const getOrgMember = (userId: string, orgId: string) =>
  prisma.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: { organizationRole: true },
  });

export const getProjectMembership = (userId: string, projectId: string) =>
  prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId, projectId },
    },
    select: { role: true },
  });

export const findConflictingProject = (
  orgId: string,
  projectName: string,
  excludeProjectId?: string,
) =>
  prisma.project.findFirst({
    where: {
      organizationId: orgId,
      projectName: normalizeProjectName(projectName),
      ...(excludeProjectId && { NOT: { id: excludeProjectId } }),
    },
    select: { id: true },
  });

export const findProjectInOrg = (projectId: string, orgId: string) =>
  prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    select: { id: true, projectName: true, projectKey: true },
  });

export async function createProjectWithMembership(
  orgId: string,
  userId: string,
  name: string,
  description: string | null,
) {
  const projectKey = (await generateProjectKey(orgId, name)).trim();
  if (!projectKey) throw new Error("Failed to generate project key");

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        projectName: normalizeProjectName(name),
        description,
        organizationId: orgId,
        createdById: userId,
        projectKey,
      },
      select: {
        id: true,
        projectName: true,
        projectKey: true,
        description: true,
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

    await seedDefaultBoardColumns(tx, project.id);

    return project;
  });
}

export async function updateProjectDetails(
  projectId: string,
  orgId: string,
  data: {
    name?: string;
    description?: string | null;
  },
  existingProject?: { projectName: string },
) {
  const updateData: {
    projectName?: string;
    description?: string | null;
    projectKey?: string;
  } = {};

  if (data.description !== undefined) updateData.description = data.description;

  if (data.name !== undefined) {
    const normalizedName = normalizeProjectName(data.name);
    updateData.projectName = normalizedName;

    if (existingProject?.projectName !== normalizedName) {
      updateData.projectKey = await generateProjectKey(
        orgId,
        data.name,
        projectId,
      );
    }
  }

  return prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });
}

export function generateBaseProjectKey(projectName: string): string {
  const words = projectName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "PRJ";

  if (words.length === 1) {
    const key = words[0]!.slice(0, 3);
    return key || "PRJ";
  }

  const key = words
    .map((word) => word[0])
    .join("")
    .slice(0, 5);

  return key || "PRJ";
}

export async function generateProjectKey(
  orgId: string,
  projectName: string,
  excludeProjectId?: string,
) {
  const baseKey = generateBaseProjectKey(projectName);

  const existingProjects = await prisma.project.findMany({
    where: {
      organizationId: orgId,
      projectKey: {
        startsWith: baseKey,
      },
      ...(excludeProjectId && { NOT: { id: excludeProjectId } }),
    },
    select: {
      projectKey: true,
    },
  });

  const existingKeys = new Set(existingProjects.map((p) => p.projectKey));
  if (!existingKeys.has(baseKey)) return baseKey;

  let counter = 2;

  while (existingKeys.has(`${baseKey}${counter}`)) {
    counter++;
  }

  return `${baseKey}${counter}`;
}

export const normalizeProjectMemberObject = ({
  role,
  user,
}: {
  role: string;
  user: { id: string; username: string; email: string };
}) => ({
  role,
  id: user.id,
  username: user.username,
  email: user.email,
});

import { ApiError } from "../utils/apiResponse.js";

const projectJoinRequestSelect = {
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

const mapProjectJoinRequest = (request: {
  id: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  createdAt: Date;
  user: { id: string; username: string; email: string };
}) => ({
  id: request.id,
  status: request.status,
  requestedOn: request.createdAt.toISOString(),
  user: request.user,
});

const assertIsProjectAdmin = async (projectId: string, userId: string) => {
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });

  if (!member || member.role !== "ADMIN") {
    throw new ApiError(403, "Only project admins can manage join requests");
  }

  return member;
};

export const sendProjectJoinRequest = async (
  userId: string,
  projectId: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      organizationId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!project) throw new ApiError(404, "Project not found");

  if (project.members.length > 0) {
    throw new ApiError(400, "You are already a member of this project");
  }

  const userInOrg = await prisma.user.findFirst({
    where: { id: userId, organizationId: project.organizationId },
    select: { id: true },
  });

  if (!userInOrg)
    throw new ApiError(403, "You are not a member of this organization");

  const existing = await prisma.joinRequest.findFirst({
    where: { userId, projectId, status: "PENDING" },
    select: { id: true },
  });

  if (existing) {
    throw new ApiError(
      409,
      "You already have a pending join request for this project",
    );
  }

  await prisma.joinRequest.create({
    data: { userId, organizationId: project.organizationId, projectId },
  });
};

export const getIncomingProjectJoinRequests = async (
  projectId: string,
  userId: string,
) => {
  await assertIsProjectAdmin(projectId, userId);

  const requests = await prisma.joinRequest.findMany({
    where: { projectId },
    select: projectJoinRequestSelect,
    orderBy: { createdAt: "desc" },
  });

  return requests.map(mapProjectJoinRequest);
};

export const reviewProjectJoinRequest = async (
  projectId: string,
  reviewerId: string,
  requestId: string,
  action: "approve" | "decline",
) => {
  await assertIsProjectAdmin(projectId, reviewerId);

  const joinRequest = await prisma.joinRequest.findFirst({
    where: { id: requestId, projectId },
    select: {
      id: true,
      status: true,
      userId: true,
      organizationId: true,
      user: { select: { id: true } },
    },
  });

  if (!joinRequest) throw new ApiError(404, "Join request not found");

  if (joinRequest.status !== "PENDING") {
    throw new ApiError(400, "This join request has already been reviewed");
  }

  if (action === "decline") {
    const updated = await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "DECLINED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
      select: projectJoinRequestSelect,
    });

    return mapProjectJoinRequest(updated);
  }

  const alreadyMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: { userId: joinRequest.userId, projectId },
    },
    select: { role: true },
  });

  if (alreadyMember) {
    throw new ApiError(400, "This user is already a member of the project");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.projectMember.create({
      data: { userId: joinRequest.userId, projectId, role: "MEMBER" },
    });

    await tx.joinRequest.updateMany({
      where: {
        userId: joinRequest.userId,
        projectId,
        status: "PENDING",
        NOT: { id: requestId },
      },
      data: {
        status: "DECLINED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
    });

    return tx.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedById: reviewerId,
        approvedOn: new Date(),
      },
      select: projectJoinRequestSelect,
    });
  });

  return mapProjectJoinRequest(updated);
};
