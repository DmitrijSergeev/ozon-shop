-- RenameTable
ALTER TABLE "SyncRun" RENAME TO "SyncJob";

-- AddColumn
ALTER TABLE "SyncJob" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'frequent';

-- CreateIndex
CREATE INDEX "SyncJob_shopId_type_idx" ON "SyncJob"("shopId", "type");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");
