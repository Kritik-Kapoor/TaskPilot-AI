// Note: We're using a simple gap-of-1000 integer scheme for column ordering.
// Since columns are rarely reordered and there are very few of them per project.

export const COLUMN_POSITION_GAP = 1000;

export const getPositionBetween = (
  before: number | null,
  after: number | null,
): number => {
  if (before === null && after === null) return COLUMN_POSITION_GAP;

  if (before === null) {
    return after! <= 1 ? 1 : after! - 1;
  }

  if (after === null) return before + COLUMN_POSITION_GAP;

  if (after - before <= 1) return before + 1;

  return Math.floor((before + after) / 2);
};
