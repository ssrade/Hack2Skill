/*
  Warnings:

  - You are about to drop the column `keyClausesJson` on the `Agreement` table. All the data in the column will be lost.
  - You are about to drop the column `riskAssessment` on the `Agreement` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agreement" DROP COLUMN "keyClausesJson",
DROP COLUMN "riskAssessment",
ADD COLUMN     "clausesJson" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "docId" TEXT,
ADD COLUMN     "risksJson" JSONB,
ADD COLUMN     "summaryJson" JSONB;
