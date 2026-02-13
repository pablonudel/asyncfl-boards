/*
  Warnings:

  - A unique constraint covering the columns `[referenceName]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idPublic]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "idPublic" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "File_referenceName_key" ON "File"("referenceName");

-- CreateIndex
CREATE UNIQUE INDEX "Project_idPublic_key" ON "Project"("idPublic");
