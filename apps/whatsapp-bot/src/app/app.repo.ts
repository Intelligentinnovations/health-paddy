import { KyselyService } from '@backend-template/database';
import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';

import { DB, MealPlan, SubscriptionPayload, SubscriptionStatus, UserPayload } from '../types';

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
        reference,
        subscriptionstatus,
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
          status: subscriptionstatus,
          startDate: date,
          endDate,
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

  async unSubscribe(userId: string) {
    return await this.client.updateTable('Subscription').set({ status: 'canceled' }).where('userId', '=', userId).executeTakeFirst()
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

  async updateUser({ payload, userId }: { payload: any, userId: string }) {
    return await this.client.updateTable('User').set(payload).where('id', '=', userId).executeTakeFirst()
  }

  async fetchCalorieRange() {
    return await this.client.selectFrom('CalorieNeed').selectAll().execute()
  }

  async fetchMealPlanByCalorieNeedId({ calorieNeedId, limit }: { calorieNeedId: string, limit: number }) {
    return await sql<MealPlan>`WITH RankedDays AS (
      SELECT *, 
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
    SELECT * FROM RankedDays
    ORDER BY rnk, day
    LIMIT ${limit};
    `.execute(this.client)

  }
}
