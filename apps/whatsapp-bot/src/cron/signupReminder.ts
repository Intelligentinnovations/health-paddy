import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as cron from 'node-cron';

import { AppRepo } from '../app/app.repo';
import { sendWhatsAppText } from '../helpers';
import { PaymentService } from '../services/paystack';

@Injectable()
export class CronService {
  constructor(private repo: AppRepo, private payment: PaymentService) {
    this.scheduleCronJob();
  }

  public async scheduleCronJob() {
    cron.schedule('0 30 * * *', async () => {
      try {
        const users = await this.repo.findUsersNotCreatedMealPlan();
        if (users.length) {
          for await (const user of users) {
            const { phone, id: userId } = user;
            const message = 'Please subscribe abeg'
            sendWhatsAppText({ message, phoneNumber: phone })
            await this.repo.updateUser({ payload: { isCreateMealPlanReminderSent: true }, userId })
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
}
