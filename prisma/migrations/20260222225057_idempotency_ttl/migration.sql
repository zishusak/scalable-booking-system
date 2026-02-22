/*
  Warnings:

  - Added the required column `expires_at` to the `idempotency_keys` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "idempotency_keys" ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");
