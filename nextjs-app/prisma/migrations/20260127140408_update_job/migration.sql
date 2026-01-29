/*
  Warnings:

  - A unique constraint covering the columns `[uniqueName]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Job_name_key";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "uniqueName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'CREATED';

-- CreateIndex
CREATE UNIQUE INDEX "Job_uniqueName_key" ON "Job"("uniqueName");
