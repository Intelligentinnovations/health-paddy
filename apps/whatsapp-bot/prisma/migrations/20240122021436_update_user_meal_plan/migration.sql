-- DropForeignKey
ALTER TABLE "UserMealPlan" DROP CONSTRAINT "UserMealPlan_userId_fkey";

-- AddForeignKey
ALTER TABLE "UserMealPlan" ADD CONSTRAINT "UserMealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
