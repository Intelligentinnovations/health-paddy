
import { snacks } from "../data/snacks.data";

/* eslint-disable @typescript-eslint/no-var-requires */
async function seedSnacks(db: any) {
  try {
    await db.transaction().execute(async (trx: any) => {
      await trx
        .insertInto("Snack")
        .values(snacks)
        .execute();
    })

  } catch (error) {
    console.log(error, "Could not seed data");

  }
}


module.exports = seedSnacks