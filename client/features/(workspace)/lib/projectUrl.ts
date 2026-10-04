export const PROJECT_ID_PARAM = "projectId";

export const getProjectIdFromParams = (
  searchParams: Pick<URLSearchParams, "get">,
): string | null => searchParams.get(PROJECT_ID_PARAM);

export const withProjectId = (path: string, projectId: string): string => {
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set(PROJECT_ID_PARAM, projectId);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};
