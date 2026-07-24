type ProjectMemberDb = Pick<
  typeof import("../config/db.js").prisma,
  "organization" | "projectMember" | "project"
>;

export async function ensureOrgOwnerIsProjectAdmin(
  db: ProjectMemberDb,
  orgId: string,
  projectId: string,
) {
  const organization = await db.organization.findUnique({
    where: { id: orgId },
    select: { ownerId: true },
  });

  if (!organization) return;

  await db.projectMember.upsert({
    where: {
      userId_projectId: {
        userId: organization.ownerId,
        projectId,
      },
    },
    create: {
      userId: organization.ownerId,
      projectId,
      role: "ADMIN",
    },
    update: {
      role: "ADMIN",
    },
  });
}

export async function ensureUserIsProjectAdminOnAllOrgProjects(
  db: ProjectMemberDb,
  orgId: string,
  userId: string,
) {
  const projects = await db.project.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });

  for (const project of projects) {
    await db.projectMember.upsert({
      where: {
        userId_projectId: { userId, projectId: project.id },
      },
      create: {
        userId,
        projectId: project.id,
        role: "ADMIN",
      },
      update: {
        role: "ADMIN",
      },
    });
  }
}
