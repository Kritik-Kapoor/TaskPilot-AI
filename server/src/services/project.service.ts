import { prisma } from "../config/db.js";
import { ensureOrgOwnerIsProjectAdmin } from "../utils/projectMember.utils.js";
import { seedDefaultBoardColumns } from "./boardColumn.service.js";
import { seedDefaultIssueTypes } from "./ticketType.service.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { ApiError } from "../utils/apiResponse.js";

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
    select: { id: true, projectName: true, projectKey: true, isDefault: true },
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
    await seedDefaultIssueTypes(tx, project.id);

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

export async function setProjectDefaultStatus(
  orgId: string,
  userId: string,
  projectId: string,
  isDefault: boolean,
) {
  const [project, organization] = await Promise.all([
    findProjectInOrg(projectId, orgId),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { ownerId: true },
    }),
  ]);

  if (!project) throw new ApiError(404, "Project not found");

  if (organization?.ownerId !== userId) {
    throw new ApiError(
      403,
      "Only the organization owner can change the default project",
    );
  }

  if (project.isDefault === isDefault) {
    return { id: project.id, isDefault };
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        if (isDefault) {
          const existingDefault = await tx.project.findFirst({
            where: {
              organizationId: orgId,
              isDefault: true,
              NOT: { id: projectId },
            },
            select: { projectName: true },
          });

          if (existingDefault) {
            throw new ApiError(
              409,
              `"${existingDefault.projectName}" is already the default project. First set it as not default, then mark this one as default.`,
            );
          }
        }

        return tx.project.update({
          where: { id: projectId },
          data: { isDefault },
          select: { id: true, isDefault: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new ApiError(
        409,
        "The default project was changed by another request. Please try again.",
      );
    }

    throw error;
  }
}

/**
 * Adds a user who belongs to no project to their organization's default
 * project as an ADMIN. The default project is looked up only within the org the
 * user actually belongs to, and an existing membership is never changed, so
 * this is safe to call repeatedly.
 */
export const joinDefaultProject = async (orgId: string, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId || user.organizationId !== orgId) {
    throw new ApiError(403, "You do not belong to this organization");
  }

  const defaultProject = await prisma.project.findFirst({
    where: { organizationId: orgId, isDefault: true },
    select: { id: true },
  });

  if (!defaultProject) {
    throw new ApiError(
      404,
      "Default project is not configured. Please contact the administrator.",
    );
  }

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId, projectId: defaultProject.id } },
    create: { userId, projectId: defaultProject.id, role: "ADMIN" },
    update: {},
  });

  return { projectId: defaultProject.id };
};
