/*
  Warnings:

  - You are about to drop the column `name` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Project` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgName]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,projectName]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgName` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectName` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Organization_name_key";

-- DropIndex
DROP INDEX "Project_organizationId_name_key";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "name",
ADD COLUMN     "orgName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "name",
ADD COLUMN     "projectName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_orgName_key" ON "Organization"("orgName");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_projectName_key" ON "Project"("organizationId", "projectName");
