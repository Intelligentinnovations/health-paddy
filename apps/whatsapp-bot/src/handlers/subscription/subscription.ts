import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { sendWhatsAppText } from '../../helpers';
import { SecretsService } from '../../secrets/secrets.service';
import { PaymentService } from '../../services/paystack';
import { State } from '../../types';
import { GenericService } from '../general';

@Injectable()
export class SubscriptionService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private secrets: SecretsService,
    private payment: PaymentService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleSubscription = async ({ phoneNumber, profileName, state, input }: { phoneNumber: string, state: State, input: number, profileName: string }) => {
    try {
      const { stage } = state
      if (stage === 'subscription-acceptance') {
        if (input == 2) {//decline
          this.helper.handleNoState({ phoneNumber, profileName })
          return {
            status: 'success'
          }
        } if (input == 1) { //accept
          const { user } = state
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const paymentLink = await this.payment.initializePaystackPayment({ email: user!.email, amountInNaira: 100, metaData: { phoneNumber }, callbackUrl: this.secrets.get('PAYSTACK_WEBHOOK') })
          const { data, status } = paymentLink
          if (status) {
            const message = `Here is the link ${data.data.authorization_url} to begin your add your card and start enjoying the 3-day trial period. Please complete the payment process to get started with the trial.`
            await this.cacheManager.set(phoneNumber, JSON.stringify({ stage: 'subscription-payment-option', data: {} }));
            sendWhatsAppText({ message, phoneNumber });
            return {
              status: 'success'
            }

          }
        } else {
          const message = 'I am not sure of your request Please enter either 1 or 2'
          this.helper.handleUnknownRequest({ phoneNumber, message })
          return {
            status: 'success'
          }
        }

      }

    } catch (error) {
      console.log({ error });

    }
    return {
      status: 'success',
    }
  }

}