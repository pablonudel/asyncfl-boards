-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "datasetsFiles" TEXT[],
ADD COLUMN     "reqFile" TEXT,
ADD COLUMN     "sourceFiles" TEXT[];
