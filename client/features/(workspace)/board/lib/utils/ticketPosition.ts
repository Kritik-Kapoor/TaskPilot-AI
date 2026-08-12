export const TICKET_POSITION_GAP = 1000;

export const getAppendPosition = (maxPosition: number | null) =>
  (maxPosition ?? 0) + TICKET_POSITION_GAP;

export const getPositionBetween = (
  before: number | null,
  after: number | null,
): number => {
  if (before === null && after === null) return TICKET_POSITION_GAP;

  if (before === null) {
    return after! <= 1 ? 1 : after! - 1;
  }

  if (after === null) return before + TICKET_POSITION_GAP;

  if (after - before <= 1) return before + 1;

  return Math.floor((before + after) / 2);
};
