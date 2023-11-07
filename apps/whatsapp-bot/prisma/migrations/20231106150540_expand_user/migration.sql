-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "healthCondition" TEXT,
ADD COLUMN     "isFirstTimeSubscriber" BOOLEAN NOT NULL DEFAULT true;
