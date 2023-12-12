/*
  Warnings:

  - You are about to drop the column `instruction` on the `Recipe` table. All the data in the column will be lost.
  - The `instructions` column on the `Recipe` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "instruction",
DROP COLUMN "instructions",
ADD COLUMN     "instructions" TEXT[];
