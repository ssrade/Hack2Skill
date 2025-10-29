/*
  Warnings:

  - The values [SIMPLER,EXPERT] on the enum `AnalysisMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AnalysisMode_new" AS ENUM ('basic', 'pro');
ALTER TABLE "Agreement" ALTER COLUMN "analysisMode" TYPE "AnalysisMode_new" USING ("analysisMode"::text::"AnalysisMode_new");
ALTER TYPE "AnalysisMode" RENAME TO "AnalysisMode_old";
ALTER TYPE "AnalysisMode_new" RENAME TO "AnalysisMode";
DROP TYPE "AnalysisMode_old";
COMMIT;
