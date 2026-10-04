-- Simplified onboarding: every user joins the single default org/project
-- automatically, so join requests are no longer needed.

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- Mark the project every new user joins automatically.
UPDATE "Project"
SET "isDefault" = true
WHERE "id" = '3fcd397d-11a5-4054-b936-a29904a646d9';

-- Backfill: accounts created before this change that never joined an org
-- become admins of the default project's org...
UPDATE "User"
SET "organizationId" = (
      SELECT "organizationId" FROM "Project" WHERE "isDefault" = true LIMIT 1
    ),
    "organizationRole" = 'ADMIN'::"OrganizationRole"
WHERE "organizationId" IS NULL
  AND EXISTS (SELECT 1 FROM "Project" WHERE "isDefault" = true);

-- ...and every member of that org gets a membership on the default project.
-- Existing memberships (and their roles) are left untouched.
INSERT INTO "ProjectMember" ("id", "userId", "projectId", "role", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."id", p."id", 'ADMIN'::"ProjectRole", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User" u
JOIN "Project" p ON p."organizationId" = u."organizationId" AND p."isDefault" = true
ON CONFLICT ("userId", "projectId") DO NOTHING;

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_projectId_fkey";

-- DropForeignKey
ALTER TABLE "JoinRequest" DROP CONSTRAINT "JoinRequest_userId_fkey";

-- DropTable
DROP TABLE "JoinRequest";

-- DropEnum
DROP TYPE "JoinRequestStatus";
