/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { addDays } from 'date-fns';

import { GenericService } from '../handlers/general';
import { SignupService } from '../handlers/signup/signup';
import { SubscriptionService } from '../handlers/subscription';
import { sendWhatsAppText } from '../helpers';
import { PaymentService } from '../services/paystack';
import { State } from '../types';
import { AppRepo } from './app.repo';

@Injectable()
export class AppService {
  constructor(
    private generalResponse: GenericService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private signup: SignupService,
    private repo: AppRepo,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async handleIncomingMessage(body: any) {
    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.messages &&
        body.entry[0].changes[0].value.messages[0]
      ) {
        const sender = body.entry[0].changes[0].value.messages[0].from;
        const msg_body = body.entry[0].changes[0].value.messages[0].text.body;
        const profileName =
          body.entry[0].changes[0].value.contacts[0].profile.name;

        const user = await this.repo.findUserByPhoneNumber(sender);
        const cache = await this.cacheManager.get<string>(sender);

        let state: State = {
          data: null,
          stage: '',
          user: undefined,
        };

        if (cache) {
          try {
            const cachedData = JSON.parse(cache);
            state = { ...cachedData, user };
          } catch (error) {
            console.error('Error parsing cached data:', error);
          }
        }

        if (!state || ['hi', 'hey'].includes(msg_body.toLowerCase())) {
          const result = await this.generalResponse.handleNoState({
            phoneNumber: sender,
            profileName,
          });
          return result;
        }

        if (state.stage === 'landing') {
          return this.generalResponse.handleLandingPageSelection({
            input: msg_body,
            phoneNumber: sender,
            profileName,
            state,
          });
        }
        if (state.stage === 'privacy') {
          return this.generalResponse.handlePrivacyResponse({
            input: msg_body,
            phoneNumber: sender,
            profileName,
          });
        }
        if (state.stage.startsWith('signup')) {
          return this.signup.handleSignup({
            input: msg_body,
            phoneNumber: sender,
            state,
            profileName,
          });
        }
        if (state.stage.startsWith('subscription')) {
          return this.subscriptionService.handleSubscription({
            input: msg_body,
            phoneNumber: sender,
            state,
            profileName,
          });
        }

        this.generalResponse.handleNoState({
          phoneNumber: sender,
          profileName,
          customHeader: 'I could not understand your request, lets start fresh again'
        });
      }
    } else {
      return {
        status: 'not-found',
      };
    }
  }

  async handlePaystackEvents(reference: string) {
    const verification = await this.paymentService.verifyPaystackTransaction(
      reference
    );
    const { status, data } = verification;

    const transactionExist = await this.repo.findTransactionByReference(
      reference
    );
    if (transactionExist) return;
    const {
      status: transactionStatus,
      amount: amountInKobo,
      authorization,
      customer: { email },
    } = data.data;
    const { phoneNumber } = data.data.metadata.custom_fields[0];

    const {
      bin: first6Digits,
      last4: last4Digits,
      brand: issuer,
      authorization_code: token,
    } = authorization;

    const amountInNaira = amountInKobo / 100;

    if (status && transactionStatus === 'success') {
      const user = await this.repo.findUserByPhoneNumber(phoneNumber);
      const currentDate = new Date();
      const endDate = addDays(currentDate, 3);
      await this.repo.createSubscription({
        token,
        type: '',
        issuer,
        userId: user!.id,
        processor: 'paystack',
        date: new Date(),
        last4Digits,
        first6Digits,
        email,
        endDate,
        subscriptionstatus: 'active',
        transactionStatus,
        amount: `${amountInNaira}`,
        reference,
      });
      sendWhatsAppText({ phoneNumber, message: `Your Card has been added 🎉, your 3-day trial has officially begun. Get ready to start your wellness journey!" 💪🏋️‍♀️` })
    }
  }
}
