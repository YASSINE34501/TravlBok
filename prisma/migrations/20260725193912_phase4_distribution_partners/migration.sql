-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('DIRECT_TRAVLBOK', 'AFFILIATE_REDIRECT', 'AFFILIATE_WHITE_LABEL', 'AFFILIATE_WIDGET');

-- CreateEnum
CREATE TYPE "DistributionVertical" AS ENUM ('HOTEL', 'CAR', 'FLIGHT');

-- CreateEnum
CREATE TYPE "DistributionProviderCode" AS ENUM ('MOCK_SANDBOX');

-- CreateTable
CREATE TABLE "DistributionClick" (
    "id" TEXT NOT NULL,
    "vertical" "DistributionVertical" NOT NULL,
    "provider" "DistributionProviderCode" NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "externalOfferId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ipAddressHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "landingPath" TEXT NOT NULL,
    "redirectUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributionClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DistributionClick_vertical_createdAt_idx" ON "DistributionClick"("vertical", "createdAt");

-- CreateIndex
CREATE INDEX "DistributionClick_visitorId_idx" ON "DistributionClick"("visitorId");
