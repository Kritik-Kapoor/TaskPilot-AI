import { addDays, format, isBefore, isValid, parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Prisma } from "../generated/prisma/client.js";

const ASSIGNMENT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_ASSIGNMENT_TIME_ZONE = "UTC";

export class AssignmentDateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssignmentDateParseError";
  }
}

export class AssignmentTimeZoneError extends Error {
  constructor(timeZone: string) {
    super(`Invalid timezone "${timeZone}".`);
    this.name = "AssignmentTimeZoneError";
  }
}

export const isValidIanaTimeZone = (timeZone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const resolveAssignmentTimeZone = (timeZone?: string | null): string => {
  const trimmed = timeZone?.trim();
  if (!trimmed) return DEFAULT_ASSIGNMENT_TIME_ZONE;

  if (!isValidIanaTimeZone(trimmed)) {
    throw new AssignmentTimeZoneError(trimmed);
  }

  return trimmed;
};

export const formatTodayInTimeZone = (timeZone: string): string =>
  formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");

/**
 * Calendar-day bounds for ticket `createdAt` filters.
 * `dateStr` (YYYY-MM-DD) is interpreted in the user's IANA timezone; returned
 * bounds are UTC instants suitable for Prisma.
 */
const calendarDayBoundsInTimeZone = (
  dateStr: string,
  timeZone: string,
): { gte: Date; lt: Date } => {
  const start = fromZonedTime(`${dateStr} 00:00:00`, timeZone);
  const nextDateStr = format(addDays(parseISO(dateStr), 1), "yyyy-MM-dd");
  const end = fromZonedTime(`${nextDateStr} 00:00:00`, timeZone);

  return { gte: start, lt: end };
};

/**
 * Parses a strict YYYY-MM-DD string. Natural-language dates must be normalized
 * by the AI layer before reaching the server.
 */
export const parseAssignmentCalendarDate = (
  value: string,
  timeZone: string,
): Date => {
  const trimmed = value.trim();

  if (!ASSIGNMENT_DATE_PATTERN.test(trimmed)) {
    throw new AssignmentDateParseError(
      `Invalid date "${value}". Please use the format YYYY-MM-DD (for example 2025-10-01).`,
    );
  }

  const parsed = parseISO(trimmed);

  if (!isValid(parsed)) {
    throw new AssignmentDateParseError(
      `Invalid date "${value}". Please use the format YYYY-MM-DD (for example 2025-10-01).`,
    );
  }

  return calendarDayBoundsInTimeZone(trimmed, timeZone).gte;
};

export const buildAssignmentCreatedAtFilter = (
  timeZone: string,
  date?: string,
  dateRange?: { from: string; to: string },
): Prisma.TicketWhereInput | null => {
  const zone = resolveAssignmentTimeZone(timeZone);

  if (date) {
    const trimmed = date.trim();
    parseAssignmentCalendarDate(trimmed, zone);
    const { gte, lt } = calendarDayBoundsInTimeZone(trimmed, zone);
    return { createdAt: { gte, lt } };
  }

  if (dateRange) {
    const fromTrimmed = dateRange.from.trim();
    const toTrimmed = dateRange.to.trim();
    const startBounds = calendarDayBoundsInTimeZone(fromTrimmed, zone);
    parseAssignmentCalendarDate(fromTrimmed, zone);
    const endDayStart = parseAssignmentCalendarDate(toTrimmed, zone);

    if (isBefore(endDayStart, startBounds.gte)) {
      throw new Error(
        "The date range's start date must be before its end date.",
      );
    }

    const endExclusive = calendarDayBoundsInTimeZone(toTrimmed, zone).lt;

    return {
      createdAt: {
        gte: startBounds.gte,
        lt: endExclusive,
      },
    };
  }

  return null;
};
