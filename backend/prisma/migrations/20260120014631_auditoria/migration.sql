-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "event" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "method" TEXT,
    "route" TEXT,
    "httpStatus" INTEGER,
    "durationMs" INTEGER,
    "ip" TEXT,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_timestamp_idx" ON "ActivityLog"("timestamp");

-- CreateIndex
CREATE INDEX "ActivityLog_event_idx" ON "ActivityLog"("event");

-- CreateIndex
CREATE INDEX "ActivityLog_status_idx" ON "ActivityLog"("status");

-- CreateIndex
CREATE INDEX "ActivityLog_archivedAt_idx" ON "ActivityLog"("archivedAt");
