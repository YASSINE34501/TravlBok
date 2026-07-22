-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "acceptsOnlinePayment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "acceptsPayAtProperty" BOOLEAN NOT NULL DEFAULT true;
