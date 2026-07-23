import type { Organization } from "../types";

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: "1", name: "Acme Corp", projectCount: 12, memberCount: 48 },
  { id: "2", name: "Globex Industries", projectCount: 5, memberCount: 22 },
  { id: "3", name: "Initech", projectCount: 8, memberCount: 35 },
  { id: "4", name: "TaskPilot Labs", projectCount: 3, memberCount: 10 },
];

const normalize = (value: string) => value.trim().toLowerCase();

export const findOrganizationByName = (name: string) =>
  MOCK_ORGANIZATIONS.find((org) => normalize(org.name) === normalize(name));

export const searchOrganizations = (query: string) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return MOCK_ORGANIZATIONS.filter((org) =>
    normalize(org.name).includes(normalizedQuery),
  );
};
