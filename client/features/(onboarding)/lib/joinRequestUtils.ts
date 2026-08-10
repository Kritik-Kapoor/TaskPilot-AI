import type {
  JoinRequestStatus,
  OrganizationJoinRequest,
} from "../types";

const JOIN_REQUEST_STATUS_PRIORITY: Record<JoinRequestStatus, number> = {
  APPROVED: 3,
  PENDING: 2,
  DECLINED: 1,
};

export const pickPreferredJoinRequestStatus = (
  current: JoinRequestStatus | undefined,
  next: JoinRequestStatus,
): JoinRequestStatus => {
  if (!current) return next;

  return JOIN_REQUEST_STATUS_PRIORITY[next] > JOIN_REQUEST_STATUS_PRIORITY[current]
    ? next
    : current;
};

export const buildJoinRequestStatusByOrgId = (
  requests: OrganizationJoinRequest[],
) =>
  requests.reduce<Record<string, JoinRequestStatus>>((acc, request) => {
    const orgId = request.organization.id;
    acc[orgId] = pickPreferredJoinRequestStatus(acc[orgId], request.status);
    return acc;
  }, {});

export const dedupeJoinRequestsByOrganization = (
  requests: OrganizationJoinRequest[],
) => {
  const statusByOrgId = buildJoinRequestStatusByOrgId(requests);
  const seenOrgIds = new Set<string>();

  return requests.reduce<OrganizationJoinRequest[]>((acc, request) => {
    const orgId = request.organization.id;
    if (seenOrgIds.has(orgId)) return acc;

    seenOrgIds.add(orgId);
    acc.push({
      ...request,
      status: statusByOrgId[orgId]!,
    });
    return acc;
  }, []);
};
