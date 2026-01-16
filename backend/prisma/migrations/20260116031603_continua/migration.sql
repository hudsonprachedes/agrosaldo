-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('ok', 'late', 'overdue', 'pending');

-- AlterTable
ALTER TABLE "Movement" ADD COLUMN     "species" TEXT DEFAULT 'bovino';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appVersion" TEXT,
ADD COLUMN     "financialStatus" "FinancialStatus",
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "monthlyRevenue" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "PendingRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "propertyName" TEXT,
    "notes" TEXT,

    CONSTRAINT "PendingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateRegulation" (
    "id" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "reportingDeadline" INTEGER NOT NULL,
    "requiredDocuments" TEXT[],
    "saldoReportFrequency" TEXT NOT NULL,
    "saldoReportDay" INTEGER NOT NULL,
    "gtaRequired" BOOLEAN NOT NULL,
    "observations" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "StateRegulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentFrequency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixConfig" (
    "id" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "pixKeyType" TEXT NOT NULL,
    "qrCodeImage" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
