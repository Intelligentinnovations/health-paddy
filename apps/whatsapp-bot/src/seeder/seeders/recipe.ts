
import { mealPlanData } from "../data/mealPlan.Data";

/* eslint-disable @typescript-eslint/no-var-requires */
async function seedRecipe(db: any) {


  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto('MealPlan')
      .values(mealPlanData.mealPlan)
      .execute()
  })

}

module.exports = seedRecipe