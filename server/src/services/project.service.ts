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
    select: { id: true },
  });

export async function createProjectWithMembership(
  orgId: string,
  userId: string,
  name: string,
  description: string | null,
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        projectName: normalizeProjectName(name),
        description,
        organizationId: orgId,
        createdById: userId,
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
