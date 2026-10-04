type ProjectMemberDb = Pick<
  typeof import("../config/db.js").prisma,
  "organization" | "projectMember"
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
