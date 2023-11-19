-- CreateTable
CREATE TABLE "CalorieNeed" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "calories" INTEGER NOT NULL,

    CONSTRAINT "CalorieNeed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "day" TEXT NOT NULL,
    "breakfast" TEXT NOT NULL,
    "breakfastCalories" INTEGER NOT NULL,
    "snack" TEXT NOT NULL,
    "snackCalories" INTEGER NOT NULL,
    "lunch" TEXT NOT NULL,
    "lunchCalories" INTEGER NOT NULL,
    "dinner" TEXT NOT NULL,
    "dinnerCalories" INTEGER NOT NULL,
    "calorieNeedId" TEXT NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_calorieNeedId_fkey" FOREIGN KEY ("calorieNeedId") REFERENCES "CalorieNeed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
