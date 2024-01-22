-- CreateTable
CREATE TABLE "UserMealPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "plan" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMPTZ NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserMealPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserMealPlan" ADD CONSTRAINT "UserMealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CalorieNeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
