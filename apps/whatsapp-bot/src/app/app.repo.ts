import { KyselyService } from '@backend-template/database';
import { Injectable } from '@nestjs/common';

import { DB, SubscriptionPayload, UserPayload } from '../types';

@Injectable()
export class AppRepo {
  constructor(private client: KyselyService<DB>) { }

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

  async createSubscription(subscriptionPayload: SubscriptionPayload) {
    return await this.client.transaction().execute(async (trx) => {
      const { userId, reference, status, token, email, first6Digits, last4Digits, issuer, type, processor, date, endDate, amount } = subscriptionPayload
      const card = await trx.insertInto('Card')
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

      const transaction = await trx.insertInto('Transaction')
        .values({
          userId,
          reference,
          status,
          updatedAt: date,
          cardId: card.id,
          amount
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await trx.insertInto('Subscription')
        .values({
          userId,
          transactionId: transaction.id,
          status,
          startDate: date,
          endDate,
          updatedAt: date
        })
        .returning('id')
        .executeTakeFirst()

      return await trx.updateTable('User')
        .set({
          subscriptionStatus: 'ACTIVE'
        })
        .where('id', '=', userId)
        .executeTakeFirst()
    })
  }

}
