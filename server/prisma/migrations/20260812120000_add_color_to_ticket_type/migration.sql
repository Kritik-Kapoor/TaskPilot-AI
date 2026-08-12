-- AlterTable
ALTER TABLE "ProjectTicketType" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#6366f1';

-- Backfill default colors per type
UPDATE "ProjectTicketType" SET "color" = '#8b5cf6' WHERE "key" = 'STORY';
UPDATE "ProjectTicketType" SET "color" = '#ef4444' WHERE "key" = 'BUG';
UPDATE "ProjectTicketType" SET "color" = '#0ea5e9' WHERE "key" = 'TASK';
UPDATE "ProjectTicketType" SET "color" = '#f59e0b' WHERE "key" = 'EPIC';
