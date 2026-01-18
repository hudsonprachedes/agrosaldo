-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'rejected';

-- CreateTable
CREATE TABLE "EpidemiologySurvey" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpidemiologySurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "maxCattle" INTEGER,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "commission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referrer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrals" INTEGER NOT NULL DEFAULT 0,
    "totalCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referrer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCommunication" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "color" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EpidemiologySurvey_propertyId_submittedAt_idx" ON "EpidemiologySurvey"("propertyId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referrer_code_key" ON "Referrer"("code");

-- AddForeignKey
ALTER TABLE "EpidemiologySurvey" ADD CONSTRAINT "EpidemiologySurvey_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
