export type Org = {
  slug: string;
  name: string;
  description?: string;
  color: string;
  projects: number;
  members: number;
};

export const MOCK_ORGS: Org[] = [
  {
    slug: "acme-corp",
    name: "Acme Corp",
    description: "Product engineering team",
    color: "#6366f1",
    projects: 12,
    members: 48,
  },
  {
    slug: "globex-industries",
    name: "Globex Industries",
    description: "Operations and logistics",
    color: "#0ea5e9",
    projects: 5,
    members: 22,
  },
  {
    slug: "initech",
    name: "Initech",
    description: "Enterprise software division",
    color: "#8b5cf6",
    projects: 8,
    members: 35,
  },
  {
    slug: "taskpilot-labs",
    name: "TaskPilot Labs",
    description: "Internal R&D workspace",
    color: "#14b8a6",
    projects: 3,
    members: 10,
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const findOrgByName = (name: string) =>
  MOCK_ORGS.find((org) => normalize(org.name) === normalize(name));

export const searchOrgs = (query: string) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return MOCK_ORGS.filter((org) => normalize(org.name).includes(normalizedQuery));
};
