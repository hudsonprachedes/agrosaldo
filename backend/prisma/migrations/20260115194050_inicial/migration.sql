-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'owner', 'manager', 'operator');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'pending_approval', 'suspended');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('active', 'pending', 'suspended');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('porteira', 'piquete', 'retiro', 'estancia', 'barao');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('birth', 'death', 'sale', 'purchase', 'vaccine', 'adjustment');

-- CreateEnum
CREATE TYPE "SexType" AS ENUM ('male', 'female');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'operator',
    "status" "UserStatus" NOT NULL DEFAULT 'pending_approval',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "cultivatedArea" DOUBLE PRECISION NOT NULL,
    "naturalArea" DOUBLE PRECISION NOT NULL,
    "cattleCount" INTEGER NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'active',
    "plan" "PlanType" NOT NULL DEFAULT 'porteira',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProperty" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "UserProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livestock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "sex" "SexType" NOT NULL,
    "headcount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livestock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sex" "SexType",
    "ageGroup" TEXT,
    "description" TEXT NOT NULL,
    "destination" TEXT,
    "value" DOUBLE PRECISION,
    "gtaNumber" TEXT,
    "photoUrl" TEXT,
    "cause" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpfCnpj_key" ON "User"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Property_name_key" ON "Property"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserProperty_userId_propertyId_key" ON "UserProperty"("userId", "propertyId");

-- AddForeignKey
ALTER TABLE "UserProperty" ADD CONSTRAINT "UserProperty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProperty" ADD CONSTRAINT "UserProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Livestock" ADD CONSTRAINT "Livestock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
