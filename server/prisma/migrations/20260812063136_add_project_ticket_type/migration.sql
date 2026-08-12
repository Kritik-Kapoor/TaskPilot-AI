-- CreateTable
CREATE TABLE "ProjectTicketType" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" "TicketType" NOT NULL,
    "position" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTicketType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectTicketType_projectId_position_idx" ON "ProjectTicketType"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTicketType_projectId_key_key" ON "ProjectTicketType"("projectId", "key");

-- AddForeignKey
ALTER TABLE "ProjectTicketType" ADD CONSTRAINT "ProjectTicketType_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
