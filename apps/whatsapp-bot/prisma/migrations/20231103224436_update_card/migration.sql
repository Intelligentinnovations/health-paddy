/*
  Warnings:

  - You are about to drop the column `first6Digit` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `last4Digit` on the `Card` table. All the data in the column will be lost.
  - Added the required column `first6Digits` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last4Digits` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "first6Digit",
DROP COLUMN "last4Digit",
ADD COLUMN     "first6Digits" TEXT NOT NULL,
ADD COLUMN     "last4Digits" TEXT NOT NULL;
