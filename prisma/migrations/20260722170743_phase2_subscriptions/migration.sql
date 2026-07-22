-- CreateEnum
CREATE TYPE "SubscriptionPlanTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD', 'SUSPENDED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('PROPERTIES', 'ROOMS_PER_PROPERTY', 'VEHICLES', 'BRANCHES', 'STAFF', 'STORAGE_MB', 'MONTHLY_BOOKINGS');

-- AlterEnum
ALTER TYPE "CouponScope" ADD VALUE 'SUBSCRIPTION';

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionPlanTier" NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "annualPrice" DECIMAL(12,2) NOT NULL,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'MAD',
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "maxProperties" INTEGER,
    "maxRoomsPerProperty" INTEGER,
    "maxVehicles" INTEGER,
    "maxBranches" INTEGER,
    "maxStaff" INTEGER,
    "maxStorageMb" INTEGER,
    "maxMonthlyBookings" INTEGER,
    "featureAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "featurePms" BOOLEAN NOT NULL DEFAULT false,
    "featureChannelManager" BOOLEAN NOT NULL DEFAULT false,
    "featureDynamicPricing" BOOLEAN NOT NULL DEFAULT false,
    "featureApiAccess" BOOLEAN NOT NULL DEFAULT false,
    "featureAffiliateTools" BOOLEAN NOT NULL DEFAULT false,
    "featurePrioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "featureCustomCommissionRates" BOOLEAN NOT NULL DEFAULT false,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billingInterval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "gracePeriodEndsAt" TIMESTAMP(3),
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "period" DATE NOT NULL,
    "value" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPlan_tier_idx" ON "SubscriptionPlan"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "UsageRecord_subscriptionId_metric_period_idx" ON "UsageRecord"("subscriptionId", "metric", "period");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
