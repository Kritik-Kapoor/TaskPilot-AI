export const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const deSlugify = (slug: string) =>
  slug
    .trim()
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const ORG_COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#14b8a6", "#f59e0b"];

export const getOrgColor = (name: string) => {
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return ORG_COLORS[Math.abs(hash) % ORG_COLORS.length];
};
