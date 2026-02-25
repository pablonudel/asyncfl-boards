/*
  Warnings:

  - You are about to drop the `Dataset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Environment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Run` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pfcCredentials` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dataset" DROP CONSTRAINT "Dataset_userId_fkey";

-- DropForeignKey
ALTER TABLE "Environment" DROP CONSTRAINT "Environment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_userId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_userId_fkey";

-- DropForeignKey
ALTER TABLE "pfcCredentials" DROP CONSTRAINT "pfcCredentials_userId_fkey";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpiresAt" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN,
ADD COLUMN     "role" TEXT;

-- DropTable
DROP TABLE "Dataset";

-- DropTable
DROP TABLE "Environment";

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "Run";

-- DropTable
DROP TABLE "pfcCredentials";
