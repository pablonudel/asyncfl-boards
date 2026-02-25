/*
  Warnings:

  - You are about to drop the column `banExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "banExpiresAt",
ADD COLUMN     "banExpires" TIMESTAMP(3);
