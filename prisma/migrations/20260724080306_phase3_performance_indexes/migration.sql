-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Reservation_organizationId_createdAt_idx" ON "Reservation"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Reservation_hotelId_status_checkInDate_idx" ON "Reservation"("hotelId", "status", "checkInDate");
