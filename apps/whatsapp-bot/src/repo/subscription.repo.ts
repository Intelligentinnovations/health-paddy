import { KyselyService } from "@backend-template/database";
import { Injectable } from "@nestjs/common";

import {DB, SubscriptionPayload, SubscriptionStatus} from "../types";
import {CardRepo} from "./card.repo";

@Injectable()
export class SubscriptionRepo {
  constructor(
    private cardRepo: CardRepo,
    private client: KyselyService<DB>
  ) { }

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
      let card = await this.cardRepo.findUserExistingCard({ last4Digits, userId });
      if (!card) {
        card = await trx.insertInto("Card")
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
          .returning("id")
          .executeTakeFirstOrThrow()
      }
      const transaction = await trx.insertInto("Transaction")
        .values({
          userId,
          reference,
          status: transactionStatus,
          updatedAt: date,
          cardId: card.id,
          amount
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      await trx.updateTable("Subscription")
        .set({ status: "expired" })
        .where("userId", "=", userId)
        .where("status", "=", "active")
        .executeTakeFirstOrThrow()

      await trx.insertInto("Subscription")
        .values({
          userId,
          transactionId: transaction.id,
          status: "active",
          startDate: date,
          endDate,
          subscriptionPlanId,
          updatedAt: date
        })
        .returning("id")
        .executeTakeFirst()

      return await trx.updateTable("User")
        .set({
          subscriptionStatus: "active"
        })
        .where("id", "=", userId)
        .executeTakeFirst()
    })
  }


  async fetchSubscription(userId: string) {
    return await this.client
      .selectFrom("Subscription")
      .select(["Subscription.status as subscriptionStatus"])
      .where("Subscription.userId", "=", userId)
      .where((eb) => eb.or([
        eb("Subscription.status", "=", "active"),
      ])).orderBy("Subscription.createdAt desc")
      .innerJoin("Transaction", "Transaction.id", "Subscription.transactionId")
      .selectAll().innerJoin("Card", "Card.id", "Transaction.cardId")
      .selectAll()
      .executeTakeFirst()
  }

  async fetchUserLastExpiredSubscription(userId: string) {
    return await this.client
      .selectFrom("Subscription")
      .select(["Subscription.status as subscriptionStatus"])
      .where("Subscription.userId", "=", userId)
      .where((eb) => eb.or([
        eb("Subscription.status", "=", "expired"),
      ])).orderBy("Subscription.createdAt desc")
      .innerJoin("SubscriptionPlan", "SubscriptionPlan.id", "Subscription.subscriptionPlanId")
      .select(["planName"])
      .innerJoin("Transaction", "Transaction.id", "Subscription.transactionId")
      .selectAll()
      .innerJoin("Card", "Card.id", "Transaction.cardId")
      .selectAll()
      .executeTakeFirst()
  }

  async unSubscribe(userId: string) {
    return await this.client.transaction().execute(async (trx) => {
      await trx
        .updateTable("Subscription")
        .set({ status: "canceled" })
        .where("userId", "=", userId)
        .executeTakeFirst()

      await trx
        .updateTable("User")
        .set({ subscriptionStatus: "canceled" })
        .where("id", "=", userId)
        .executeTakeFirst()
    })
  }

  async updateSubscriptionStatus({ userId, status }: { userId: string, status: SubscriptionStatus }) {
    return await this.client
      .updateTable("Subscription")
      .set({ status })
      .where("userId", "=", userId)
      .executeTakeFirst()
  }


  async updateUserSubscriptionStatus({ userId, status }: { userId: string, status: SubscriptionStatus }) {
    return await this.client
      .updateTable("User")
      .set({ subscriptionStatus: status })
      .where("id", "=", userId)
      .executeTakeFirst()
  }
  async fetchDueSubscription() {
    return await this.client
      .selectFrom("Subscription")
      .selectAll()
      .where("endDate", "<=", new Date())
      .where((eb) => eb.or([
        eb("status", "=", "active"),
        eb("status", "=", "canceled"),
      ])).execute()
  }

  async fetchSubscriptionPlans() {
    return this.client
      .selectFrom("SubscriptionPlan")
      .selectAll()
      .where("isSpecialPlan", "=", false)
      .execute()
  }

  async fetchSpecialSubscriptionPlan() {
    return this.client
      .selectFrom("SubscriptionPlan")
      .selectAll()
      .where("isSpecialPlan", "=", true)
      .executeTakeFirst()
  }


}
