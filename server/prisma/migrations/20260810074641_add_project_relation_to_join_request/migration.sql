-- CreateIndex
CREATE INDEX "JoinRequest_projectId_status_idx" ON "JoinRequest"("projectId", "status");

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
