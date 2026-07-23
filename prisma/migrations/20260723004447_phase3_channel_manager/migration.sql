-- CreateEnum
CREATE TYPE "ChannelProviderCode" AS ENUM ('BOOKING_COM', 'EXPEDIA', 'AIRBNB', 'AGODA', 'HOTELS_COM', 'VRBO', 'MOCK_SANDBOX');

-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "SyncJobType" AS ENUM ('AVAILABILITY', 'RATES', 'RESTRICTIONS', 'RESERVATION_IMPORT', 'FULL');

-- CreateEnum
CREATE TYPE "SyncJobDirection" AS ENUM ('PUSH', 'PULL');

-- CreateEnum
CREATE TYPE "SyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL', 'CONFLICT');

-- CreateEnum
CREATE TYPE "SyncLogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "ChannelConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "provider" "ChannelProviderCode" NOT NULL,
    "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "externalHotelId" TEXT,
    "credentialsCiphertext" TEXT,
    "credentialsIv" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "autoSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelRoomMapping" (
    "id" TEXT NOT NULL,
    "channelConnectionId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "externalRoomId" TEXT NOT NULL,
    "externalRatePlanId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelRoomMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "channelConnectionId" TEXT NOT NULL,
    "type" "SyncJobType" NOT NULL,
    "direction" "SyncJobDirection" NOT NULL,
    "status" "SyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "triggeredByUserId" TEXT,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLogEntry" (
    "id" TEXT NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "level" "SyncLogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelReservationImport" (
    "id" TEXT NOT NULL,
    "channelConnectionId" TEXT NOT NULL,
    "externalReservationId" TEXT NOT NULL,
    "reservationId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "conflictNotes" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelReservationImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelConnection_organizationId_idx" ON "ChannelConnection"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnection_hotelId_provider_key" ON "ChannelConnection"("hotelId", "provider");

-- CreateIndex
CREATE INDEX "ChannelRoomMapping_channelConnectionId_idx" ON "ChannelRoomMapping"("channelConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelRoomMapping_channelConnectionId_roomTypeId_key" ON "ChannelRoomMapping"("channelConnectionId", "roomTypeId");

-- CreateIndex
CREATE INDEX "SyncJob_channelConnectionId_status_idx" ON "SyncJob"("channelConnectionId", "status");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");

-- CreateIndex
CREATE INDEX "SyncLogEntry_syncJobId_idx" ON "SyncLogEntry"("syncJobId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelReservationImport_reservationId_key" ON "ChannelReservationImport"("reservationId");

-- CreateIndex
CREATE INDEX "ChannelReservationImport_channelConnectionId_idx" ON "ChannelReservationImport"("channelConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelReservationImport_channelConnectionId_externalReserv_key" ON "ChannelReservationImport"("channelConnectionId", "externalReservationId");

-- AddForeignKey
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelRoomMapping" ADD CONSTRAINT "ChannelRoomMapping_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelRoomMapping" ADD CONSTRAINT "ChannelRoomMapping_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncJob" ADD CONSTRAINT "SyncJob_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLogEntry" ADD CONSTRAINT "SyncLogEntry_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "SyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelReservationImport" ADD CONSTRAINT "ChannelReservationImport_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelReservationImport" ADD CONSTRAINT "ChannelReservationImport_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
