-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN     "hasCookingMethods" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasParts" BOOLEAN NOT NULL DEFAULT false;
