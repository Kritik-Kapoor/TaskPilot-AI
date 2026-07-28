import { prisma } from "../config/db.js";
import { ensureOrgOwnerIsProjectAdmin } from "../utils/projectMember.utils.js";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";

export const normalizeProjectName = (name: string) => name.toLowerCase();

export const DUPLICATE_PROJECT_NAME_MESSAGE =
  "A project with this name already exists in your organization";

export const isDuplicateProjectNameError = (error: unknown) =>
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
