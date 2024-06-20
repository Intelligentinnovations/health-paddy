
import { foodList, foodPortion, foodVariant } from "../data/food.data";

/* eslint-disable @typescript-eslint/no-var-requires */
async function seedFoodBank(db: any) {
  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto("FoodItem")
      .values(foodList)
      .execute();

    await trx
      .insertInto("FoodVariant")
      .values(foodVariant)
      .execute()

    await trx
      .insertInto("FoodPortion")
      .values(foodPortion)
      .execute()
  })

}

module.exports = seedFoodBank