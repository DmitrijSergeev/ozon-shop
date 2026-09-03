-- AlterTable
ALTER TABLE "Order" ADD COLUMN "postingNumber" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "scheme" TEXT NOT NULL DEFAULT 'fbs';
