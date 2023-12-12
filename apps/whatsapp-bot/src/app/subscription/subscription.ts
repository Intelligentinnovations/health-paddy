/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { capitalizeString, formatCurrency, formatDate } from '../../helpers';
import { SecretsService } from '../../secrets/secrets.service';
import { PaymentService } from '../../services/paystack';
import { State } from '../../types';
import { AppRepo } from '../app.repo';
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

  handleSubscription = async ({
    phoneNumber,
    profileName,
    state,
    input,
  }: {
    phoneNumber: string;
    state: State;
    input: number;
    profileName: string;
  }) => {
    try {
      const ACCEPT = 1;
      const DECLINE = 2;

      const { stage, user } = state;
      if (stage === 'subscription-acceptance') {
        if (input == DECLINE) {
          return this.helper.handleNoState({ phoneNumber, profileName });
        }
        if (input == ACCEPT) {
          const paymentLink = await this.payment.initializePaystackPayment({
            email: user!.email,
            amountInNaira: 100,
            metaData: { phoneNumber },
            callbackUrl: this.secrets.get('PAYSTACK_WEBHOOK'),
          });
          const { data, status } = paymentLink;
          if (status) {
            const message = `Please follow the link ${data.data.authorization_url} to add your card and start enjoy our free 1-day meal plan.`;
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message,
              nextStage: 'subscription-payment-option',
              state
            });
          }
        } else {
          const message =
            'I am not sure of your request Please enter either 1 or 2';
          return this.helper.handleUnknownRequest({ phoneNumber, message });
        }
      }

      if (stage === 'subscription-management') {
        if (input == ACCEPT) {
          const subscription = await this.repo.fetchSubscription(user!.id);

          const message = `Subscription Status\n
Dear ${user?.name}
Here's a quick update on your subscription:\n
Amount: ${formatCurrency(+subscription!.amount)}
Status: ${capitalizeString(subscription!.subscriptionStatus)}
${subscription?.status === 'active' ? 'Next billing date' : 'Expires on'}: ${formatDate(subscription!.endDate)}
Billed with: ${subscription?.issuer} ****${subscription?.last4Digits}\n         
If you have any questions, contact our support team.
Best regards`;
          await this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: 'landing',
            state
          });
          return this.helper.handleNoState({
            phoneNumber,
            profileName: user!.name,
            customHeader: `Hi, how else can I be of service to you?`
          })
        }

        if (input == DECLINE) {
          const message = `Please note that canceling your subscription will not affect your access to our services. You will continue to enjoy your subscription benefits until the current subscription period expires, but it won't be renewed\n
1. Accept
2, Decline`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: 'subscription-cancel',
            state
          });
        }
        return this.helper.handleNoState({
          phoneNumber,
          profileName,
          customHeader: 'Could not understand your request, Lets start this again'
        });
      }

      if (stage === 'subscription-cancel') {
        const subscriptionStatus = await this.repo.fetchSubscription((user!.id))
        const message = subscriptionStatus?.status !== 'active' ? `Your subscription has either expired or canceled ` : `We respect your decision to unsubscribe. 😢 Thank you for being a part of our community. If you ever decide to return, we'll be here. 🙌`
        if (input == ACCEPT) {
          subscriptionStatus?.status === 'active' ?? await this.repo.unSubscribe(user!.id);
          return this.helper.handleNoState({
            phoneNumber,
            profileName,
            customHeader: message,
          });
        }
        if (input == DECLINE) {
          return this.helper.handleNoState({ phoneNumber, profileName });
        }
        return this.helper.handleNoState({
          phoneNumber,
          profileName,
          customHeader: 'Could not understand your request, lets start this again'
        });
      }
    } catch (error) {
      console.log({ error });
    }
    return {
      status: 'success',
    };
  };
}
