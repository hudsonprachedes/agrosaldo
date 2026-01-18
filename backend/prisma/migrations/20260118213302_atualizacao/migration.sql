-- CreateTable
CREATE TABLE "PublicDocumentValidation" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicDocumentValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicDocumentValidation_tokenHash_key" ON "PublicDocumentValidation"("tokenHash");

-- CreateIndex
CREATE INDEX "PublicDocumentValidation_propertyId_idx" ON "PublicDocumentValidation"("propertyId");

-- CreateIndex
CREATE INDEX "PublicDocumentValidation_expiresAt_idx" ON "PublicDocumentValidation"("expiresAt");

-- AddForeignKey
ALTER TABLE "PublicDocumentValidation" ADD CONSTRAINT "PublicDocumentValidation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
