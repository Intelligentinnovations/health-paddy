
import { mealPlanData } from "../data/mealPlan.Data";

/* eslint-disable @typescript-eslint/no-var-requires */
async function seedMealPlan(db: any) {
  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto('CalorieNeed')
      .values(mealPlanData.calories)
      .execute();

    await trx
      .insertInto('MealPlan')
      .values(mealPlanData.mealPlan)
      .execute()
  })

}

module.exports = seedMealPlan