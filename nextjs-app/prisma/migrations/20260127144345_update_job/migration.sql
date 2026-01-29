/*
  Warnings:

  - You are about to drop the column `uniqueName` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[folderId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `folderId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Job_uniqueName_key";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "uniqueName",
ADD COLUMN     "folderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Job_folderId_key" ON "Job"("folderId");
