/*
  Warnings:

  - You are about to drop the column `saldoReportDay` on the `StateRegulation` table. All the data in the column will be lost.
  - You are about to drop the column `saldoReportFrequency` on the `StateRegulation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uf]` on the table `StateRegulation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `declarationFrequency` to the `StateRegulation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `declarationPeriods` to the `StateRegulation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsibleAgency` to the `StateRegulation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HerdDeclarationStatus" AS ENUM ('pending', 'submitted');

-- AlterTable
ALTER TABLE "StateRegulation" DROP COLUMN "saldoReportDay",
DROP COLUMN "saldoReportFrequency",
ADD COLUMN     "declarationFrequency" INTEGER NOT NULL,
ADD COLUMN     "declarationPeriods" JSONB NOT NULL,
ADD COLUMN     "notificationLeadDays" INTEGER[],
ADD COLUMN     "requiredVaccines" TEXT[],
ADD COLUMN     "responsibleAgency" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HerdDeclaration" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "competence" TEXT NOT NULL,
    "status" "HerdDeclarationStatus" NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3),
    "protocol" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HerdDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HerdDeclaration_propertyId_idx" ON "HerdDeclaration"("propertyId");

-- CreateIndex
CREATE INDEX "HerdDeclaration_uf_year_competence_idx" ON "HerdDeclaration"("uf", "year", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "HerdDeclaration_propertyId_uf_year_competence_key" ON "HerdDeclaration"("propertyId", "uf", "year", "competence");

-- CreateIndex
CREATE UNIQUE INDEX "StateRegulation_uf_key" ON "StateRegulation"("uf");

-- AddForeignKey
ALTER TABLE "HerdDeclaration" ADD CONSTRAINT "HerdDeclaration_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
