-- CreateEnum
CREATE TYPE "PricingRuleFactor" AS ENUM ('SEASON', 'DAY_OF_WEEK', 'WEEKEND', 'HOLIDAY', 'SPECIAL_EVENT', 'OCCUPANCY', 'REMAINING_INVENTORY', 'BOOKING_WINDOW', 'LENGTH_OF_STAY', 'DEMAND_LEVEL');

-- CreateEnum
CREATE TYPE "PricingComparisonOperator" AS ENUM ('GTE', 'LTE');

-- CreateEnum
CREATE TYPE "PricingAdjustmentType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "DemandLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PricingRuleApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PriceLogSource" AS ENUM ('LIVE', 'RECALCULATED');

-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "maxPrice" DECIMAL(12,2),
ADD COLUMN     "minPrice" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomTypeId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "factor" "PricingRuleFactor" NOT NULL,
    "comparisonOperator" "PricingComparisonOperator",
    "thresholdValue" DECIMAL(8,2),
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dateRangeStart" DATE,
    "dateRangeEnd" DATE,
    "demandLevel" "DemandLevel",
    "adjustmentType" "PricingAdjustmentType" NOT NULL,
    "adjustmentValue" DECIMAL(8,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "activeFrom" TIMESTAMP(3),
    "activeTo" TIMESTAMP(3),
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "PricingRuleApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPriceLog" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "finalPrice" DECIMAL(12,2) NOT NULL,
    "appliedRuleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occupancyRatePercent" DECIMAL(5,2),
    "remainingInventory" INTEGER,
    "source" "PriceLogSource" NOT NULL DEFAULT 'LIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPriceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PricingRule_hotelId_isActive_idx" ON "PricingRule"("hotelId", "isActive");

-- CreateIndex
CREATE INDEX "PricingRule_roomTypeId_idx" ON "PricingRule"("roomTypeId");

-- CreateIndex
CREATE INDEX "DynamicPriceLog_roomTypeId_date_idx" ON "DynamicPriceLog"("roomTypeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPriceLog_roomTypeId_date_key" ON "DynamicPriceLog"("roomTypeId", "date");

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPriceLog" ADD CONSTRAINT "DynamicPriceLog_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
