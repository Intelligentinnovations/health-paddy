/*
  Warnings:

  - You are about to alter the column `weight` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(9,2)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "weight" SET DATA TYPE DECIMAL(9,2);
