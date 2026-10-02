const PROJECT_SCOPED_PATHS = new Set([
  "/board",
  "/backlog",
  "/inbox",
  "/assistant",
  "/members",
  "/settings",
  "/project-join-request",
]);

export const isProjectScopedPath = (pathname: string) => {
  if (PROJECT_SCOPED_PATHS.has(pathname)) {
    return true;
  }

  return pathname.startsWith("/ticket/");
};

export const ORG_ACCESSIBLE_PATHS = new Set([
  "/projects",
  "/organization",
  "/profile",
  "/join-request",
  "/user-management",
]);

export const isOrgAccessiblePath = (pathname: string) =>
  ORG_ACCESSIBLE_PATHS.has(pathname);
