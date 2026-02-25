/*
  Warnings:

  - Made the column `banned` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `role` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "banned" SET NOT NULL,
ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'user';
