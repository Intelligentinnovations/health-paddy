import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as cron from 'node-cron';

import { PaymentService } from '../services/paystack';
import {CardRepo, SubscriptionRepo} from "../repo";

@Injectable()
export class CronService {
  constructor(
    private subscriptionRepo: SubscriptionRepo,
    private cardRepo: CardRepo,
    private payment: PaymentService
  ) {
    this.scheduleCronJob();
  }

  public async scheduleCronJob() {
    // cron.schedule('0 10 * * *', async () => {
    try {
      const dueSubscriptions = await this.subscriptionRepo.fetchDueSubscription();

      if (dueSubscriptions.length) {
        for await (const dueSubscription of dueSubscriptions) {
          const { userId, status: subscriptionStatus, subscriptionPlanId } = dueSubscription;
          const cards = await this.cardRepo.fetchUserCards(userId);
          if (cards.length) {
            for await (const card of cards) {
              if (subscriptionStatus === 'active') {
                const charge = await this.payment.chargePaystackCard({
                  amount: 10,
                  cardEmail: card.email,
                  authorizationCode: card.token,
                });
                if (
                  charge.data.status &&
                  charge?.data?.data?.status === 'success'
                ) {
                  const today = DateTime.now();
                  await this.subscriptionRepo.createSubscription({
                    userId,
                    subscriptionPlanId,
                    reference: charge.data.data.reference,
                    token: card.token,
                    email: card.email,
                    first6Digits: card.first6Digits,
                    last4Digits: card.last4Digits,
                    issuer: card.issuer,
                    type: card.issuer,
                    processor: 'paystack',
                    date: today.toJSDate(),
                    endDate: today.plus({ month: 1 }).toJSDate(),
                    amount: '10000', // this should be plan-driven
                    transactionStatus: 'success',
                  });
                  break;
                } else {
                  // send message of expired subscription because we could not charge card
                  await this.subscriptionRepo.updateSubscriptionStatus({
                    userId,
                    status: 'expired',
                  });
                  await this.subscriptionRepo.updateUserSubscriptionStatus({
                    userId,
                    status: 'expired',
                  });
                }
              } else if (subscriptionStatus === 'canceled') {
                await this.subscriptionRepo.updateUserSubscriptionStatus({
                  userId,
                  status: 'expired',
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    // });
  }
}
