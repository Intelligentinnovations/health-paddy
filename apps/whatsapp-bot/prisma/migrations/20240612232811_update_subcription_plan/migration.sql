/*
  Warnings:

  - You are about to drop the column `hasCommunity` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `hasSwapMealItem` on the `SubscriptionPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "hasCommunity",
DROP COLUMN "hasSwapMealItem",
ALTER COLUMN "noOfRecipes" SET DATA TYPE TEXT;
