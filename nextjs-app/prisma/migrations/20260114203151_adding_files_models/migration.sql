/*
  Warnings:

  - You are about to drop the `simfiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "simfiles" DROP CONSTRAINT "simfiles_simulationId_fkey";

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "simulationId" TEXT;

-- DropTable
DROP TABLE "simfiles";

-- CreateTable
CREATE TABLE "inFiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "fileType" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,

    CONSTRAINT "inFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outFiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "fileShape" INTEGER[],
    "simulationId" TEXT NOT NULL,

    CONSTRAINT "outFiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inFiles" ADD CONSTRAINT "inFiles_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outFiles" ADD CONSTRAINT "outFiles_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "simulations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
