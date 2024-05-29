import { KyselyService } from '@backend-template/database';
import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { DB, MealPlan, SubscriptionPayload, SubscriptionStatus, UserPayload } from '../types';
import { getDiffBetweenDates } from '../helpers';

@Injectable()
export class AppRepo {
  constructor(
    private client: KyselyService<DB>
  ) { }

  async findUserByPhoneNumber(phoneNumber: string) {
    return await this.client.selectFrom('User').selectAll().where('phone', '=', phoneNumber)
      .executeTakeFirst();
  }
  async findUserByEmail(email: string) {
    return await this.client.selectFrom('User').selectAll().where('email', '=', email)
      .executeTakeFirst();
  }
  async createUser(payload: UserPayload) {
    return await this.client.insertInto("User").values({ ...payload, updatedAt: new Date() }).executeTakeFirst()
  }
  async findTransactionByReference(reference: string) {
    return await this.client.selectFrom("Transaction").selectAll().where('reference', '=', reference).executeTakeFirst()
  }
  async findUserExistingCard({ last4Digits, userId }: { last4Digits: string, userId: string }) {
    return await this.client.selectFrom("Card").select('id').where('last4Digits', '=', last4Digits).where('userId', '=', userId).executeTakeFirst()
  }
  async createSubscription(subscriptionPayload: SubscriptionPayload) {
    return await this.client.transaction().execute(async (trx) => {
      const {
        userId,
        subscriptionPlanId,
        reference,
        transactionStatus,
        token,
        email,
        first6Digits,
        last4Digits,
        issuer,
        type,
        processor,
        date,
        endDate,
        amount
      } = subscriptionPayload
      let card = await this.findUserExistingCard({ last4Digits, userId });
      if (!card) {
        card = await trx.insertInto('Card')
          .values({
            token,
            email,
            first6Digits,
            last4Digits,
            issuer,
            type,
            processor,
            updatedAt: date,
            userId
          })
          .returning('id')
          .executeTakeFirstOrThrow()
      }
      const transaction = await trx.insertInto('Transaction')
        .values({
          userId,
          reference,
          status: transactionStatus,
          updatedAt: date,
          cardId: card.id,
          amount
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await trx.updateTable('Subscription').set({ status: 'expired' }).where('userId', '=', userId).where('status', '=', 'active').executeTakeFirstOrThrow()
      await trx.insertInto('Subscription')
        .values({
          userId,
          transactionId: transaction.id,
          status: "active",
          startDate: date,
          endDate,
          subscriptionPlanId,
          updatedAt: date
        })
        .returning('id')
        .executeTakeFirst()

      return await trx.updateTable('User')
        .set({
          subscriptionStatus: 'active'
        })
        .where('id', '=', userId)
        .executeTakeFirst()
    })
  }


  async fetchSubscription(userId: string) {
    return await this.client
      .selectFrom('Subscription')
      .select(['Subscription.status as subscriptionStatus'])
      .where('Subscription.userId', '=', userId)
      .where((eb) => eb.or([
        eb('Subscription.status', '=', 'active'),
      ])).orderBy('Subscription.createdAt desc')
      .innerJoin('Transaction', 'Transaction.id', 'Subscription.transactionId')
      .selectAll().innerJoin('Card', 'Card.id', 'Transaction.cardId').selectAll()
      .executeTakeFirst()
  }

  async fetchUserLastExpiredSubscription(userId: string) {
    return await this.client
      .selectFrom('Subscription')
      .select(['Subscription.status as subscriptionStatus'])
      .where('Subscription.userId', '=', userId)
      .where((eb) => eb.or([
        eb('Subscription.status', '=', 'expired'),
      ])).orderBy('Subscription.createdAt desc')
      .innerJoin('SubscriptionPlan', 'SubscriptionPlan.id', 'Subscription.subscriptionPlanId').select(['planName'])
      .innerJoin('Transaction', 'Transaction.id', 'Subscription.transactionId').selectAll()
      .innerJoin('Card', 'Card.id', 'Transaction.cardId').selectAll()
      .executeTakeFirst()
  }

  async unSubscribe(userId: string) {
    return await this.client.transaction().execute(async (trx) => {
      await trx.updateTable('Subscription').set({ status: 'canceled' }).where('userId', '=', userId).executeTakeFirst()
      await trx.updateTable('User').set({ subscriptionStatus: 'canceled' }).where('id', '=', userId).executeTakeFirst()
    })
  }

  async updateSubscriptionStatus({ userId, status }: { userId: string, status: SubscriptionStatus }) {
    return await this.client.updateTable('Subscription').set({ status }).where('userId', '=', userId).executeTakeFirst()
  }


  async updateUserSubscriptionStatus({ userId, status }: { userId: string, status: SubscriptionStatus }) {
    return await this.client.updateTable('User').set({ subscriptionStatus: status }).where('id', '=', userId).executeTakeFirst()
  }
  async fetchDueSubscription() {
    return await this.client.selectFrom('Subscription').selectAll().where('endDate', '<=', new Date()).where((eb) => eb.or([
      eb('status', '=', 'active'),
      eb('status', '=', 'canceled'),
    ])).execute()
  }

  async fetchUserCards(userId: string) {
    return await this.client.selectFrom('Card').selectAll().where('userId', '=', userId).execute()
  }

  async fetchUserDefaultCard(userId: string) {
    return await this.client.selectFrom('Card').selectAll().where('userId', '=', userId).executeTakeFirstOrThrow()
  }

  async updateUser({ payload, userId }: { payload: any, userId: string }) {
    return await this.client.updateTable('User').set(payload).where('id', '=', userId).executeTakeFirst()
  }

  async fetchCalorieRange(planNo: number) {
    return await this.client.selectFrom('CalorieNeed').selectAll().where('planNo', '=', planNo).execute()
  }

  async fetchMealPlanByCalorieNeedId({ calorieNeedId, limit }: { calorieNeedId: string, limit: number }) {
    return await sql<MealPlan>`WITH RankedDays AS (
      SELECT
        *,
        ROW_NUMBER() OVER (ORDER BY
          CASE
            WHEN day = 'Sunday' THEN 1
            WHEN day = 'Monday' THEN 2
            WHEN day = 'Tuesday' THEN 3
            WHEN day = 'Wednesday' THEN 4
            WHEN day = 'Thursday' THEN 5
            WHEN day = 'Friday' THEN 6
            WHEN day = 'Saturday' THEN 7
            ELSE 8
          END
        ) AS rnk
      FROM "MealPlan"
      WHERE "calorieNeedId" = ${calorieNeedId}
    )

    , MatchingSnacks AS (
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
    LEFT JOIN MatchingSnacks ms ON rd."calorieNeedId" = ms."calorieNeedId" AND rd."day" = ms."day"
    WHERE rd.rnk >= EXTRACT(DOW FROM CURRENT_DATE) + 1
    ORDER BY rd.rnk, rd.day
    LIMIT ${limit};
    `.execute(this.client)

  }

  async getRecipe({ calorie, mealName }: { calorie: number, mealName: string }) {
    return this.client
      .selectFrom('Recipe').selectAll()
      .where('totalCalorie', '=', calorie).where("name", "ilike", mealName)
      .executeTakeFirst()
  }

  async saveUserMealPlan({ userId, plan, startDate, endDate }: { userId: string, plan: string, startDate: Date, endDate: Date }) {
    return this.client
      .insertInto('UserMealPlan').values({ endDate, plan, userId, startDate }).executeTakeFirst()
  }

  async fetchCurrentMealPlan(userId: string) {
    return this.client
      .selectFrom('UserMealPlan').selectAll().where('endDate', '>=', new Date()).where('userId', '=', userId).executeTakeFirst()
  }

  async fetchSubscriptionPlans() {
    return this.client
      .selectFrom('SubscriptionPlan').selectAll().where("isSpecialPlan", '=', false).execute()
  }

  async fetchSpecialSubscriptionPlan() {
    return this.client
      .selectFrom('SubscriptionPlan').selectAll().where("isSpecialPlan", '=', true).executeTakeFirst()
  }

  async fetchSubscriptionPlanById(planId: string) {
    return this.client
      .selectFrom('SubscriptionPlan').selectAll().where("id", '=', planId).executeTakeFirst()
  }

  async findUsersNotCreatedMealPlan() {
    const currentDate = new Date();
    const thirtyMinutesAgo = new Date(currentDate.getTime() - 30 * 60000);
    return await this.client.selectFrom('User').selectAll().where('createdAt', '>=', thirtyMinutesAgo).where('isCreateMealPlanReminderSent', '=', false).execute();
  }

}
