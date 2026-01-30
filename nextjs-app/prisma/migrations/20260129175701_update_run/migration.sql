/*
  Warnings:

  - A unique constraint covering the columns `[runFolderId]` on the table `Run` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `runFolderId` to the `Run` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Run_runName_key";

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "runFolderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Run_runFolderId_key" ON "Run"("runFolderId");
