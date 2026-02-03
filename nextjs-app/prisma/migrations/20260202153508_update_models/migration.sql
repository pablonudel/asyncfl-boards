/*
  Warnings:

  - You are about to drop the `RunDataset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RunDataset" DROP CONSTRAINT "RunDataset_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "RunDataset" DROP CONSTRAINT "RunDataset_runId_fkey";

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "datasetsIds" TEXT[];

-- DropTable
DROP TABLE "RunDataset";
