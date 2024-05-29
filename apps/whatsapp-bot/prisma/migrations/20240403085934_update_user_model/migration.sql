/*
  Warnings:

  - You are about to drop the column `hasUsedFreeTrial` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstname` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastname` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hasUsedFreeTrial",
DROP COLUMN "name",
ADD COLUMN     "firstname" TEXT NOT NULL,
ADD COLUMN     "isCreateMealPlanReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastname" TEXT NOT NULL;
