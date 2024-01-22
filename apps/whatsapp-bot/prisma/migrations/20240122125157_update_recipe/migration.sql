/*
  Warnings:

  - You are about to drop the column `calorieNeedId` on the `Recipe` table. All the data in the column will be lost.
  - Added the required column `totalCalorie` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_calorieNeedId_fkey";

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "calorieNeedId",
ADD COLUMN     "totalCalorie" INTEGER NOT NULL;
