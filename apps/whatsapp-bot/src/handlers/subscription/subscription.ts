/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { formatCurrency } from '../../helpers';
import { SecretsService } from '../../secrets/secrets.service';
import { PaymentService } from '../../services/paystack';
import { State, User } from '../../types';
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
            const message = `Here is the link ${data.data.authorization_url} to begin, your add your card and start enjoying the 3-day trial period. Please complete the payment process to get started with the trial.`;
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message,
              stage: 'subscription-payment-option',
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
          const { id: userId } = user as User;
          const subscription = await this.repo.fetchSubscription(
            userId as unknown as string
          );
          const message = `Subscription Status\n
Dear ${user?.name}
Here's a quick update on your subscription:\n
Amount: ${formatCurrency(+subscription!.amount)}
Status: ${subscription?.status.toLocaleLowerCase()}
${subscription?.status === 'active' ? 'Next billing date' : 'Expires on'}: ${subscription?.endDate.toISOString().split('T')[0]}
Billed with: ${subscription?.issuer} ****${subscription?.last4Digits}\n         
If you have any questions, contact our support team.
Best regards`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            stage: 'landing',
          });
        }

        if (input == DECLINE) {
          const message = `Please note that canceling your subscription will not affect your access to our services. You will continue to enjoy your subscription benefits until the current subscription period expires, but it won't be renewed\n
1. Accept
2, Decline`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            stage: 'subscription-cancel',
          });
        }
        return this.helper.handleNoState({ phoneNumber, profileName, customHeader: 'Could not understand your request, Lets start this again' });
      }

      if (stage === 'subscription-cancel') {
        const { id: userId } = user as User;
        const subscriptionStatus = await this.repo.fetchSubscription((userId as unknown as string))
        const message = subscriptionStatus?.status !== 'active' ? `Your subscription has either expired or canceled ` : `We respect your decision to unsubscribe. 😢 Thank you for being a part of our community. If you ever decide to return, we'll be here. 🙌`
        if (input == ACCEPT) {
          subscriptionStatus?.status === 'active' ?? await this.repo.unSubscribe(userId as unknown as string);
          return this.helper.handleNoState({
            phoneNumber,
            profileName,
            customHeader: message,
          });
        }
        if (input == DECLINE) {
          return this.helper.handleNoState({ phoneNumber, profileName });
        }
        return this.helper.handleNoState({ phoneNumber, profileName, customHeader: 'Could not understand your request, lets start this again' });
      }
    } catch (error) {
      console.log({ error });
    }
    return {
      status: 'success',
    };
  };
}
