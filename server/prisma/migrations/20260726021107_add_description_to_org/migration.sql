/*
  Warnings:

  - Added the required column `description` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "OrganizationJoinRequest_userId_organizationId_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "description" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "description" SET NOT NULL;
