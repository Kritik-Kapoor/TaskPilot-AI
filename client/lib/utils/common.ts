export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const COLORS = ["#6366f1", "#0ea5e9", "#8b5cf6", "#14b8a6", "#f59e0b"];

export const getColor = (name: string) => {
  let hash = 0;

  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return COLORS[Math.abs(hash) % COLORS.length];
};

export const formatDisplayName = (name: string) =>
  name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(100, 100, 100, ${alpha})`;
  return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
};

export const issueTypeBadgeStyle = (
  color: string,
): { borderColor: string; color: string; backgroundColor: string } => ({
  borderColor: color,
  color,
  backgroundColor: hexToRgba(color, 0.1),
});

export const capitalizeFirstChar = (value: string) =>
  value.charAt(0) + value.slice(1).toLowerCase();
