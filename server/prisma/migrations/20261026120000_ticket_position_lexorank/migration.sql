-- Migration: Convert Ticket.position from Int to String (LexoRank)

-- Existing tickets are re-ranked per column, preserving their current order,
-- using evenly spread 4-character base-26 ranks ('aaaa'..'zzzz').
--   gap = floor(456976 / (n + 1)),  val = (idx + 1) * gap
-- A column with a single ticket gets 'naaa' (centred).

-- 1. Temporary nullable column
ALTER TABLE "Ticket" ADD COLUMN "positionRank" TEXT;

-- 2. Compute ranks (integer arithmetic only)
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY "columnId" ORDER BY position ASC, "createdAt" ASC))::BIGINT - 1 AS idx,
    (COUNT(*) OVER (PARTITION BY "columnId"))::BIGINT AS total
  FROM "Ticket"
),
vals AS (
  SELECT
    id,
    total,
    (idx + 1) * (456976 / (total + 1)) AS val
  FROM ranked
)
UPDATE "Ticket" t
SET "positionRank" = CASE
  WHEN v.total = 1 THEN 'naaa'
  ELSE
    CHR(97 + ((v.val / 17576) % 26)::INT) ||
    CHR(97 + ((v.val / 676)   % 26)::INT) ||
    CHR(97 + ((v.val / 26)    % 26)::INT) ||
    CHR(97 + (v.val           % 26)::INT)
END
FROM vals v
WHERE t.id = v.id;

-- 3. Swap columns
ALTER TABLE "Ticket" ALTER COLUMN "positionRank" SET NOT NULL;
ALTER TABLE "Ticket" DROP COLUMN "position";
ALTER TABLE "Ticket" RENAME COLUMN "positionRank" TO "position";

-- 4. Recreate index (dropped together with the old column)
DROP INDEX IF EXISTS "Ticket_columnId_position_idx";
CREATE INDEX "Ticket_columnId_position_idx" ON "Ticket"("columnId", "position");
