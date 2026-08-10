/*
  Warnings:

  - You are about to drop the `OrganizationJoinRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationJoinRequest" DROP CONSTRAINT "OrganizationJoinRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationJoinRequest" DROP CONSTRAINT "OrganizationJoinRequest_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationJoinRequest" DROP CONSTRAINT "OrganizationJoinRequest_userId_fkey";

-- DropTable
DROP TABLE "OrganizationJoinRequest";

-- CreateTable
CREATE TABLE "JoinRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "approvedById" TEXT,
    "approvedOn" TIMESTAMP(3),
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JoinRequest_organizationId_status_idx" ON "JoinRequest"("organizationId", "status");

-- CreateIndex
CREATE INDEX "JoinRequest_userId_status_idx" ON "JoinRequest"("userId", "status");

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
