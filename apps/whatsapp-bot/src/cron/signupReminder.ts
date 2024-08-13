import { Injectable } from '@nestjs/common';
import * as cron from 'node-cron';

import { UserRepo } from '../repo';
import { sendWhatsAppText } from '../helpers';
import { PaymentService } from '../services/paystack';

@Injectable()
export class CronService {
  constructor(
    private userRepo: UserRepo,
    private payment: PaymentService) {
    this.scheduleCronJob();
  }

  public async scheduleCronJob() {
    cron.schedule('0 30 * * *', async () => {
      try {
        const users = await this.userRepo.findUsersNotCreatedMealPlan();
        if (users.length) {
          for await (const user of users) {
            const { phone, id: userId } = user;
            const message = 'Please subscribe abeg'
            await sendWhatsAppText({ message, phoneNumber: phone })
            await this.userRepo.updateUser({ payload: { isCreateMealPlanReminderSent: true }, userId })
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
}
