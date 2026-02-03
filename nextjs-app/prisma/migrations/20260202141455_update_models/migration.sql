/*
  Warnings:

  - You are about to drop the column `datasetsFiles` on the `Run` table. All the data in the column will be lost.
  - You are about to drop the `JobDataset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "JobDataset" DROP CONSTRAINT "JobDataset_datasetId_fkey";

-- DropForeignKey
ALTER TABLE "JobDataset" DROP CONSTRAINT "JobDataset_jobId_fkey";

-- AlterTable
ALTER TABLE "Run" DROP COLUMN "datasetsFiles",
ADD COLUMN     "pythonVersion" TEXT,
ADD COLUMN     "runSnapshot" JSONB;

-- DropTable
DROP TABLE "JobDataset";

-- CreateTable
CREATE TABLE "RunDataset" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "runId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,

    CONSTRAINT "RunDataset_pkey" PRIMARY KEY ("runId","datasetId")
);

-- AddForeignKey
ALTER TABLE "RunDataset" ADD CONSTRAINT "RunDataset_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunDataset" ADD CONSTRAINT "RunDataset_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
