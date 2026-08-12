-- Pin every existing Backlog column to position 1 so it is always the
-- lowest possible value. This ensures getPositionBetween() can never
-- produce a position below 1, which would be unreachable by midpoint math.
UPDATE "BoardColumn"
SET "position" = 1
WHERE LOWER("name") = 'backlog';
