-- CreateTable
CREATE TABLE "HerdBatch" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "species" TEXT NOT NULL DEFAULT 'bovino',
    "sex" "SexType" NOT NULL,
    "initialAgeGroup" TEXT NOT NULL,
    "currentAgeGroup" TEXT NOT NULL,
    "baseDate" TIMESTAMP(3) NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HerdBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HerdBatch_propertyId_species_idx" ON "HerdBatch"("propertyId", "species");

-- CreateIndex
CREATE INDEX "HerdBatch_propertyId_species_sex_currentAgeGroup_idx" ON "HerdBatch"("propertyId", "species", "sex", "currentAgeGroup");

-- AddForeignKey
ALTER TABLE "HerdBatch" ADD CONSTRAINT "HerdBatch_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
