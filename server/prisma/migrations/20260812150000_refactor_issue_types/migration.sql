-- ============================================================
-- Refactor: ProjectTicketType → IssueType
-- Ticket.type (enum) → Ticket.typeId (FK → IssueType)
-- IssueType gets a FK one-to-many back-relation to Ticket
-- ============================================================

-- 1. Add color column if missing from the previous manual migration
ALTER TABLE "ProjectTicketType" ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT '#6366f1';
UPDATE "ProjectTicketType" SET "color" = '#8b5cf6' WHERE "key"::text = 'STORY' AND "color" = '#6366f1';
UPDATE "ProjectTicketType" SET "color" = '#ef4444' WHERE "key"::text = 'BUG'   AND "color" = '#6366f1';
UPDATE "ProjectTicketType" SET "color" = '#0ea5e9' WHERE "key"::text = 'TASK'  AND "color" = '#6366f1';
UPDATE "ProjectTicketType" SET "color" = '#f59e0b' WHERE "key"::text = 'EPIC'  AND "color" = '#6366f1';

-- 2. Rename table
ALTER TABLE "ProjectTicketType" RENAME TO "IssueType";

-- 3. Fix primary key constraint name
ALTER TABLE "IssueType" DROP CONSTRAINT IF EXISTS "ProjectTicketType_pkey";
ALTER TABLE "IssueType" ADD CONSTRAINT "IssueType_pkey" PRIMARY KEY ("id");

-- 4. Change key from TicketType enum → lowercase TEXT
ALTER TABLE "IssueType" ALTER COLUMN "key" TYPE TEXT USING LOWER("key"::text);

-- 5. Drop position column
ALTER TABLE "IssueType" DROP COLUMN IF EXISTS "position";

-- 6. Fix indexes
DROP INDEX IF EXISTS "ProjectTicketType_projectId_position_idx";
DROP INDEX IF EXISTS "ProjectTicketType_projectId_key_key";
CREATE UNIQUE INDEX "IssueType_projectId_key_key" ON "IssueType"("projectId", "key");

-- 7. Fix FK constraint
ALTER TABLE "IssueType" DROP CONSTRAINT IF EXISTS "ProjectTicketType_projectId_fkey";
ALTER TABLE "IssueType" ADD CONSTRAINT "IssueType_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Add typeId FK column to Ticket
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "typeId" TEXT;

-- 9. Migrate Ticket.type → Ticket.typeId (look up matching IssueType per project)
UPDATE "Ticket" t
SET "typeId" = it."id"
FROM "IssueType" it
WHERE it."projectId" = t."projectId"
  AND it."key" = LOWER(t."type"::text);

-- 10. Add FK + index for typeId
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_typeId_fkey"
    FOREIGN KEY ("typeId") REFERENCES "IssueType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Ticket_typeId_idx" ON "Ticket"("typeId");

-- 11. Drop old Ticket.type column
ALTER TABLE "Ticket" DROP COLUMN IF EXISTS "type";

-- 12. Drop TicketType enum
DROP TYPE IF EXISTS "TicketType";
