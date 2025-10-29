-- CreateEnum
CREATE TYPE "AnalysisMode" AS ENUM ('SIMPLER', 'EXPERT');

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "analysisMode" "AnalysisMode";
