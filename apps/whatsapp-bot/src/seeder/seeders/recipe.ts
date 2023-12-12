
import { recipe } from "../data/recipe.data";

/* eslint-disable @typescript-eslint/no-var-requires */
async function seedRecipe(db: any) {

  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto('Recipe')
      .values(recipe)
      .execute()
  })

}

module.exports = seedRecipe