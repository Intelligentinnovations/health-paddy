/*
  Warnings:

  - The values [starch,fruit,vegetable,milk,protein,fat_and_oil,snack] on the enum `FoodCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FoodCategory_new" AS ENUM ('Starch', 'Fruits', 'Protein', 'Fat_and_Oil', 'Snacks', 'Milk_and_Yoghurt', 'Drinks');
ALTER TABLE "FoodItem" ALTER COLUMN "category" TYPE "FoodCategory_new" USING ("category"::text::"FoodCategory_new");
ALTER TYPE "FoodCategory" RENAME TO "FoodCategory_old";
ALTER TYPE "FoodCategory_new" RENAME TO "FoodCategory";
DROP TYPE "FoodCategory_old";
COMMIT;
