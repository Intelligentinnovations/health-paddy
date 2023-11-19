/* eslint-disable @typescript-eslint/no-var-requires */
const { mealPlanData } = require("../helpers/mealPlanData");
const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');

const { DB } = require('../types')

async function seed() {
  const dialect = new PostgresDialect({
    pool: new Pool({
      database: 'health_paddy',
      host: 'localhost',
      user: 'postgres',
      password: 'postgres',
      port: 5432,
      max: 10,
    })
  })

  const db = new Kysely({ dialect });

  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto('CalorieNeed')
      .values(mealPlanData.calories)
      .execute();

    await trx
      .insertInto('MealPlan')
      .values(mealPlanData.mealPlan)
      .execute()
  }

  )
  await db.destroy()

}

seed();