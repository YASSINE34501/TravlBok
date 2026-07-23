-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY['IN_APP']::TEXT[];
