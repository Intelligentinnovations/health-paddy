import { KyselyService } from "@backend-template/database";
import { Injectable } from "@nestjs/common";
import { sql } from "kysely";

import {DB, MealPlan } from "../types";

@Injectable()
export class MealPlanRepo {
  constructor(
    private client: KyselyService<DB>
  ) { }

  async fetchCalorieRange(planNo: number) {
    return await this.client
      .selectFrom("CalorieNeed")
      .selectAll()
      .where("planNo", "=", planNo)
      .execute()
  }

  async fetchMealPlanByCalorieNeedId({ calorieNeedId, limit }: { calorieNeedId: string, limit: number }) {
    return await sql<MealPlan>`WITH CurrentDay AS (
      SELECT
        CURRENT_DATE AS today,
        EXTRACT(DOW FROM CURRENT_DATE) AS dow
    ),

                                    RankedDays AS (
                                      SELECT
                                        mp.*,
                                        ROW_NUMBER() OVER (ORDER BY
      CASE
        WHEN mp.day = 'Sunday' THEN (7 + 0 - cd.dow) % 7
        WHEN mp.day = 'Monday' THEN (7 + 1 - cd.dow) % 7
        WHEN mp.day = 'Tuesday' THEN (7 + 2 - cd.dow) % 7
        WHEN mp.day = 'Wednesday' THEN (7 + 3 - cd.dow) % 7
        WHEN mp.day = 'Thursday' THEN (7 + 4 - cd.dow) % 7
        WHEN mp.day = 'Friday' THEN (7 + 5 - cd.dow) % 7
        WHEN mp.day = 'Saturday' THEN (7 + 6 - cd.dow) % 7
        ELSE 8
      END
    ) AS rnk
                                      FROM "MealPlan" mp, CurrentDay cd
                                      WHERE mp."calorieNeedId" = ${calorieNeedId}
                                    ),

                                    MatchingSnacks AS (
                                      SELECT DISTINCT ON (mp."calorieNeedId", mp."day")
                                 mp."calorieNeedId",
                                 mp."day",
                                 s."snack",
                                 RANDOM() AS random_order
                               FROM "MealPlan" mp
                                 JOIN "Snack" s ON mp."snackCalories" = s."calories"
                               WHERE mp."snackCalories" IS NOT NULL
                               ORDER BY mp."calorieNeedId", mp."day", random_order
                                 )

    SELECT
      rd.*,
      ms."snack"
    FROM RankedDays rd
           LEFT JOIN MatchingSnacks ms
                     ON rd."calorieNeedId" = ms."calorieNeedId"
                       AND rd."day" = ms."day"
    ORDER BY rd.rnk
      LIMIT ${limit};`.execute(this.client)

  }


  async saveUserMealPlan({ userId, plan, startDate, endDate }: { userId: string, plan: string, startDate: Date, endDate: Date }) {
    return this.client
      .insertInto("UserMealPlan")
      .values({ endDate, plan, userId, startDate })
      .executeTakeFirst()
  }

  async fetchCurrentMealPlan(userId: string) {
    return this.client
      .selectFrom("UserMealPlan")
      .selectAll()
      .where("endDate", ">=", new Date())
      .where("userId", "=", userId)
      .executeTakeFirst()
  }

  async deleteCurrentMealPlan(userId: string) {
    return this.client
      .deleteFrom("UserMealPlan")
      .where("endDate", ">=", new Date())
      .where("userId", "=", userId)
      .executeTakeFirst()
  }


  async getRecipe({ calorie, mealName }: { calorie: number, mealName: string }) {
    return this.client
      .selectFrom("Recipe")
      .selectAll()
      .where("totalCalorie", "=", calorie)
      .where("name", "ilike", mealName)
      .executeTakeFirst()
  }


  async searchFoodBank(query: string) {
    return this.client
      .selectFrom("FoodItem")
      .select(["FoodItem.name as foodItemName", "FoodItem.hasParts as hasParts", "FoodItem.hasCookingMethods as cookingMethods"])
      .where("FoodItem.name", "ilike", `${query}%`)
      .leftJoin("FoodVariant", "FoodItem.id", "FoodVariant.foodId")
      .select(["FoodVariant.name as foodVariantName"])
      .leftJoin("FoodPortion", "FoodVariant.id", "FoodPortion.foodVariantId")
      .select(["FoodPortion.calorie", "FoodPortion.size"])
      .execute()

  }

}
