export const BACKLOG_COLUMN_NAME = "Backlog" as const;

export const DEFAULT_BOARD_COLUMNS = [
  { name: BACKLOG_COLUMN_NAME, color: "#6b7280", position: 1000 },
  { name: "Todo", color: "#0ea5e9", position: 2000 },
  { name: "In Progress", color: "#f59e0b", position: 3000 },
  { name: "In Review", color: "#8b5cf6", position: 4000 },
  { name: "Done", color: "#10b981", position: 5000 },
] as const;
