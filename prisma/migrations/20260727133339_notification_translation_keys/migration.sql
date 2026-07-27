-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "messageKey" TEXT,
ADD COLUMN     "paramsJson" JSONB,
ADD COLUMN     "titleKey" TEXT;
