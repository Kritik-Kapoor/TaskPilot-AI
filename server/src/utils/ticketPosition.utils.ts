export const TICKET_POSITION_GAP = 1000;

// Position ticket at the end
export const getAppendPosition = (maxPosition: number | null) =>
  (maxPosition ?? 0) + TICKET_POSITION_GAP;

// Position ticket in between
export const getPositionBetween = (
  before: number | null,
  after: number | null,
): number | null => {
  if (before === null && after === null) return TICKET_POSITION_GAP;

  if (before === null) return after! <= 1 ? null : Math.floor(after! / 2);

  if (after === null) return before + TICKET_POSITION_GAP;

  if (after - before <= 1) return null;

  return Math.floor((before + after) / 2);
};
