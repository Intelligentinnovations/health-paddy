/*
  Warnings:

  - You are about to drop the column `snack` on the `MealPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MealPlan" DROP COLUMN "snack";

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "ingredients" TEXT[],
    "instruction" TEXT[],
    "calorieNeedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_calorieNeedId_fkey" FOREIGN KEY ("calorieNeedId") REFERENCES "CalorieNeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
