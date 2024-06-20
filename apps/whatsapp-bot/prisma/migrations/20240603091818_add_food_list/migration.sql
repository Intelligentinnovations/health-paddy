/*
  Warnings:

  - You are about to drop the `FoodItems` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "FoodItems";

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" "FoodCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodVariant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "foodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodPortion" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "foodVariantId" TEXT NOT NULL,
    "calorie" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodPortion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FoodVariant" ADD CONSTRAINT "FoodVariant_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "FoodItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodPortion" ADD CONSTRAINT "FoodPortion_foodVariantId_fkey" FOREIGN KEY ("foodVariantId") REFERENCES "FoodVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
