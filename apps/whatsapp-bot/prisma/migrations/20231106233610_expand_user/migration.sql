/*
  Warnings:

  - You are about to drop the column `isFirstTimeSubscriber` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isFirstTimeSubscriber",
ADD COLUMN     "hasUsedFreeTrial" BOOLEAN NOT NULL DEFAULT false;
