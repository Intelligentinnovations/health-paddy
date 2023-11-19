-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('starch', 'fruit', 'vegetable', 'milk', 'protein', 'fat_and_oil', 'snack');

-- CreateTable
CREATE TABLE "FoodItems" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "calorie" INTEGER NOT NULL,
    "portion" TEXT NOT NULL,
    "category" "FoodCategory" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItems_pkey" PRIMARY KEY ("id")
);
