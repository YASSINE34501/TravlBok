-- AlterTable
ALTER TABLE "OrganizationMember" ADD COLUMN     "branchId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "insuranceExpiryAt" DATE,
ADD COLUMN     "lastMaintenanceAt" DATE,
ADD COLUMN     "nextMaintenanceDueAt" DATE;

-- CreateIndex
CREATE INDEX "OrganizationMember_branchId_idx" ON "OrganizationMember"("branchId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "CarBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
