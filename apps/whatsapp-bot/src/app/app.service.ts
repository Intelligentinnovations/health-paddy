/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';

import { delay, sendWhatsAppText } from '../helpers';
import { SecretsService } from "../secrets/secrets.service";
import { PaymentService } from '../services/paystack';
import { State } from '../types';
import { AppRepo } from './app.repo';
import { SignupService } from './auth/signup'
import { GenericService } from './general';
import { CreateMealPlanService } from './meal-plan';
import { SubscriptionService } from './subscription/subscription'

@Injectable()
export class AppService {
  constructor(
    private generalResponse: GenericService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private signup: SignupService,
    private createMealPlan: CreateMealPlanService,
    private repo: AppRepo,
    private secrets: SecretsService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async handleIncomingMessage(body: any) {
    try {
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


          let state = await this.cacheManager.get<State>(sender);
          if (!state?.user?.id) {
            const initialState: State = {
              data: {},
              stage: 'landing',
              user: undefined
            };
            const user = await this.repo.findUserByPhoneNumber(sender);
            state = { ...initialState, user }
            await this.cacheManager.set(sender, state);
          }


          if (!state || ['hi', 'hey'].includes(msg_body.toLowerCase())) {
            return await this.generalResponse.handleNoState({
              phoneNumber: sender,
              profileName,
              state: state!
            });
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
              state
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
          if (state.stage.startsWith('create-meal-plan')) {
            return this.createMealPlan.handleCreateMealPlan({
              input: msg_body,
              phoneNumber: sender,
              state,
            });
          }
          return this.generalResponse.handleNoState({
            phoneNumber: sender,
            profileName,
            state,
            customHeader: 'I could not understand your request, lets start afresh'
          });
        }
      } else {
        return {
          status: 'not-found',
        };
      }
    } catch (error) {
      console.log({ error });

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

    const today = DateTime.now();

    if (status && transactionStatus === 'success') {
      const user = await this.repo.findUserByPhoneNumber(phoneNumber);
      const endDate = today.plus({ day: this.secrets.get('FREE_PLAN_DAYS') }).toJSDate();
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
        subscriptionStatus: 'active',
        transactionStatus,
        amount: `${amountInNaira}`,
        reference,
      });
      await sendWhatsAppText({ phoneNumber, message: `Your card has been added 🎉, you can now access your free one-day meal Plan. Get ready to start your wellness journey!" 💪` })
      await delay()
      await this.generalResponse.handleNoState({
        phoneNumber,
        state: { stage: '', user, data: {} },
        profileName: user!.name, customHeader: 'You now have access to all our meal plan service'
      })
    }
  }
}
