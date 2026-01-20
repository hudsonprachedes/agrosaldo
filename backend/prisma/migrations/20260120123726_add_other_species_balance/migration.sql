-- CreateTable
CREATE TABLE "OtherSpeciesBalance" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherSpeciesBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtherSpeciesBalance_propertyId_idx" ON "OtherSpeciesBalance"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "OtherSpeciesBalance_propertyId_species_key" ON "OtherSpeciesBalance"("propertyId", "species");

-- AddForeignKey
ALTER TABLE "OtherSpeciesBalance" ADD CONSTRAINT "OtherSpeciesBalance_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
