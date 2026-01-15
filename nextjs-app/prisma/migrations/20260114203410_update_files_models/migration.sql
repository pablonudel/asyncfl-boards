/*
  Warnings:

  - You are about to drop the `inFiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `outFiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inFiles" DROP CONSTRAINT "inFiles_simulationId_fkey";

-- DropForeignKey
ALTER TABLE "outFiles" DROP CONSTRAINT "outFiles_simulationId_fkey";

-- DropTable
DROP TABLE "inFiles";

-- DropTable
DROP TABLE "outFiles";

-- CreateTable
CREATE TABLE "in_files" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "fileType" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,

    CONSTRAINT "in_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "out_files" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "fileShape" INTEGER[],
    "simulationId" TEXT NOT NULL,

    CONSTRAINT "out_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "in_files" ADD CONSTRAINT "in_files_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "out_files" ADD CONSTRAINT "out_files_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
