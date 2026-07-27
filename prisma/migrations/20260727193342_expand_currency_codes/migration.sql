-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CurrencyCode" ADD VALUE 'GBP';
ALTER TYPE "CurrencyCode" ADD VALUE 'CAD';
ALTER TYPE "CurrencyCode" ADD VALUE 'CHF';
ALTER TYPE "CurrencyCode" ADD VALUE 'AED';
ALTER TYPE "CurrencyCode" ADD VALUE 'SAR';
ALTER TYPE "CurrencyCode" ADD VALUE 'QAR';
ALTER TYPE "CurrencyCode" ADD VALUE 'KWD';
ALTER TYPE "CurrencyCode" ADD VALUE 'JPY';
ALTER TYPE "CurrencyCode" ADD VALUE 'CNY';
ALTER TYPE "CurrencyCode" ADD VALUE 'AUD';
ALTER TYPE "CurrencyCode" ADD VALUE 'NZD';
ALTER TYPE "CurrencyCode" ADD VALUE 'TRY';
ALTER TYPE "CurrencyCode" ADD VALUE 'SEK';
ALTER TYPE "CurrencyCode" ADD VALUE 'NOK';
ALTER TYPE "CurrencyCode" ADD VALUE 'DKK';
ALTER TYPE "CurrencyCode" ADD VALUE 'PLN';
ALTER TYPE "CurrencyCode" ADD VALUE 'BRL';
ALTER TYPE "CurrencyCode" ADD VALUE 'INR';
ALTER TYPE "CurrencyCode" ADD VALUE 'MXN';
ALTER TYPE "CurrencyCode" ADD VALUE 'SGD';
ALTER TYPE "CurrencyCode" ADD VALUE 'HKD';
