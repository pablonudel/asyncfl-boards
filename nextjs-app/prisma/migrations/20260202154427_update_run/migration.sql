/*
  Warnings:

  - You are about to drop the column `datasetsIds` on the `Run` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Run" DROP COLUMN "datasetsIds",
ADD COLUMN     "datasetsFiles" TEXT[] DEFAULT ARRAY[]::TEXT[];
