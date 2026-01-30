/*
  Warnings:

  - A unique constraint covering the columns `[fileName]` on the table `Dataset` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Dataset_fileName_key" ON "Dataset"("fileName");
