import { prisma } from "../config/db.js";

export const getUserAuthPayload = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      username: true,
      organizationId: true,
      organizationRole: true,
      organization: {
        select: {
          orgName: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    email: user.email,
    username: user.username,
    organizationId: user.organizationId,
    organizationRole: user.organizationRole,
    organizationName: user.organization?.orgName ?? null,
    organizationProjectCount: user.organization?._count.projects ?? 0,
  };
};
