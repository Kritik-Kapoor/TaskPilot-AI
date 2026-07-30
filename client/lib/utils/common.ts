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
