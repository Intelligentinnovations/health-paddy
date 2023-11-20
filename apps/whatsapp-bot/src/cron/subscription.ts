import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

// import * as cron from 'node-cron';
import { AppRepo } from '../app/app.repo';
import { PaymentService } from '../services/paystack';

@Injectable()
export class CronService {
  constructor(private repo: AppRepo, private payment: PaymentService) {
    this.scheduleCronJob();
  }

  public async scheduleCronJob() {
    // cron.schedule('0 10 * * *', async () => {
    try {
      const dueSubscriptions = await this.repo.fetchDueSubscription();

      if (dueSubscriptions.length) {
        for await (const dueSubscription of dueSubscriptions) {
          const { userId, status: subscriptionStatus } = dueSubscription;
          const cards = await this.repo.fetchUserCards(userId);
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
                  await this.repo.createSubscription({
                    userId,
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
                    amount: '10000', // this should be plan driven
                    subscriptionstatus: 'active',
                    transactionStatus: 'success',
                  });
                  break;
                } else {
                  // send message of expired subscription because we could not charge card
                  await this.repo.updateSubscriptionStatus({
                    userId,
                    status: 'expired',
                  });
                  await this.repo.updateUserSubscriptionStatus({
                    userId,
                    status: 'expired',
                  });
                }
              } else if (subscriptionStatus === 'canceled') {
                await this.repo.updateUserSubscriptionStatus({
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
