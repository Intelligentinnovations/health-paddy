/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';

import { formatCurrency, sendWhatsAppText } from '../helpers';
import { SecretsService } from '../secrets/secrets.service';
import { PaymentService } from '../services/paystack';
import { State, SubscriptionPlan } from '../types';
import { AppRepo } from './app.repo';
import { SignupService } from './auth/signup';
import { GenericService } from './general';
import { CreateMealPlanService, ViewRecipeService } from './meal-plan';
import { SubscriptionService } from './subscription/subscription';

@Injectable()
export class AppService {
  constructor(
    private generalResponse: GenericService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private signup: SignupService,
    private createMealPlan: CreateMealPlanService,
    private recipe: ViewRecipeService,
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
              stage: state?.stage || 'landing',
              user: undefined,
              data: state?.data
            };
            const user = await this.repo.findUserByPhoneNumber(sender);
            state = { ...initialState, user }
            await this.cacheManager.set(sender, state);
          }
          const greetings = ['hey', 'hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'hi health paddy', 'hello health paddy']
          if (!state || greetings.includes(msg_body.toLowerCase())) {
            return await this.generalResponse.handleNoState({
              phoneNumber: sender,
              profileName,
              state
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
          if (state.stage.startsWith('view-recipe')) {
            return this.recipe.handleViewRecipe({
              input: msg_body,
              phoneNumber: sender,
              state,
            });
          }
          return this.generalResponse.handleNoState({
            phoneNumber: sender,
            profileName,
            customHeader: 'I could not understand your request, lets start afresh',
            state
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
    const { phoneNumber, planPaidFor } =
      data.data.metadata.custom_fields[0] as { phoneNumber: string, planPaidFor: SubscriptionPlan };

    const {
      bin: first6Digits,
      last4: last4Digits,
      brand: issuer,
      authorization_code: token,
    } = authorization;

    const amountInNaira = amountInKobo / 100;
    const today = DateTime.now();
    const endDate = today.plus({ months: 1 }).toJSDate();

    if (status && transactionStatus === 'success') {
      const user = await this.repo.findUserByPhoneNumber(phoneNumber);
      await this.repo.createSubscription({
        subscriptionPlanId: planPaidFor!.id as unknown as string,
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
        transactionStatus,
        amount: `${amountInNaira}`,
        reference,
      });
      if (!planPaidFor.isSpecialPlan) {
        const message = `Subscription alert\n
Payment completed successfully 🙌, You can now enjoy all our services".\n
Plan: ${planPaidFor.planName}
Amount paid: ${formatCurrency(Number(amountInNaira))}
Expires on: ${endDate.toDateString()}`
        return sendWhatsAppText({ message, phoneNumber })
      } else {
        const message = 'Your payment has been received, Please fill the form below'
        await this.generalResponse.sendCallToActionAndSetCache({
          message,
          phoneNumber,
          state: { data: {}, stage: '', user: undefined },
          nextStage: '',
          data,
          link: this.secrets.get('HEALTH_ISSUES_FORM_LINK'),
          callToActionText: 'Fill Form'
        })
        return sendWhatsAppText({ message, phoneNumber })
      }
    }
  }

}
