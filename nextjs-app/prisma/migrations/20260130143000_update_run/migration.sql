-- DropForeignKey
ALTER TABLE "Run" DROP CONSTRAINT "Run_environmentId_fkey";

-- AlterTable
ALTER TABLE "Run" ALTER COLUMN "environmentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
