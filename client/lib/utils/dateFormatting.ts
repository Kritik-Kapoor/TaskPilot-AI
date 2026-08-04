import { format, parseISO } from "date-fns";

export const formatDateTime = (value: string | Date) => {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "MMM d, yyyy, h:mm a");
};
