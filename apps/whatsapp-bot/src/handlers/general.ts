/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../app/app.repo';
import { sendWhatsAppText } from '../helpers';
import { SecretsService } from '../secrets/secrets.service';
import { State } from '../types';

@Injectable()
export class GenericService {
  constructor(
    private repo: AppRepo,
    private secrets: SecretsService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleLandingPageSelection = async ({
    phoneNumber,
    input,
    profileName,
    state,
  }: {
    phoneNumber: string;
    input: string;
    profileName: string;
    state: State;
  }) => {
    const protectedSelection = ['2', '3', '4', '5', '6']
    const SIGN_UP = '1'
    const CREATE_MEAL_PLAN = '2'
    const View_MEAL_PLAN = '3'
    const SWAP_MEAL_ITEMS = '4'
    const SUPPORT = '5'
    const SUBSCRIPTION = '6'

    if (!state.user && protectedSelection.includes(input)) {
      return this.handleNoState({
        phoneNumber,
        profileName,
        customHeader: `Looks like you do not have an account as I could not find any account matching your phone number. please select 1 to signup`,
      });
    }

    switch (input) {
      case SIGN_UP:
        if (state.user) {
          this.handleNoState({
            phoneNumber,
            profileName,
            customHeader:
              'You are already signed up, How else can be of service',
          });
          break;
        }
        this.handlePrivacy(phoneNumber);
        break;
      case CREATE_MEAL_PLAN:
        if (state.user?.subscriptionStatus === 'active') return this.handlePaymentNotification({ phoneNumber })
        await this.sendTextAndSetCache({ message: `Hi, ${state.user?.name} I'd love to chat with you and ask a few questions to help create your personalized meal plan. 😊`, phoneNumber, stage: 'create-meal-plan/age' })
        sendWhatsAppText({ message: 'Please tell me your age', phoneNumber })
        break;

      case SUBSCRIPTION:
        if (state.user?.subscriptionStatus === 'active') {
          return this.sendTextAndSetCache({
            message: `Manage your subscription\n
1. View Subscription
2. Cancel Subscription `, phoneNumber, stage: 'subscription-management'
          })
        }
        sendWhatsAppText({ message: `😔😔 I'm sorry, but you don't currently have an active subscription. To enjoy all the benefits, please consider subscribing.`, phoneNumber })
        break;
      default:
        return this.handleNoState({ phoneNumber, profileName, customHeader: 'I could not understand your your request, lets start again' })
    }

    return {
      status: 'success',
    };
  };

  handleNoState = async ({
    phoneNumber,
    profileName,
    customHeader,
  }: {
    phoneNumber: string;
    profileName: string;
    customHeader?: string;
  }) => {
    try {
      const heading = customHeader
        ? customHeader
        : `Hi! ${profileName}, I am Health Paddy! Your personal meal planning assistant. How may I be of service to you today?`;
      sendWhatsAppText({
        phoneNumber, message: `${heading}\n
1. Signup
2. Create Meal Plan
3. View My Meal Plan
4. Swap Meal Items
5. Log a Complaint
6. Manage Subscription`});
    } catch (error) {
      console.log({ error });
    }
    const key = phoneNumber;
    await this.cacheManager.set(
      key,
      JSON.stringify({ stage: 'landing', data: {} }), this.secrets.get('THIRTY_MINUTES_IN_SECONDS')
    );

    return {
      status: 'success',
    };
  };

  handlePrivacy = async (phoneNumber: string) => {
    const message = `Privacy Notice
                
We may collect the following personal data:
- Name
- Age
- Gender
- Height
- Weight
- Activity level
- Dietary preferences

How We Use Your Information
- Calculate your estimated daily calorie requirements
- Provide personalized nutrition and fitness recommendations
- Improve our services
- Respond to your inquiries

Data Security
We prioritize the security of your personal data. We implement measures to protect your data from unauthorized access, disclosure, alteration, and destruction.

Consent
By using our chat bot, you consent to the collection and use of your personal data as described in this privacy notice.

1. Accept
2. Reject`
    return this.sendTextAndSetCache({ message, phoneNumber, stage: 'privacy' })
  };

  handlePrivacyResponse = async ({
    phoneNumber,
    input,
    profileName,
  }: {
    phoneNumber: string;
    input: string;
    profileName: string;
  }) => {
    const message = `Great! 🚀 Thanks for saying 'yes' to our privacy notice. Your data is in good hands! Please follow the prompt below to get signup`;
    if (input === '1') {
      await sendWhatsAppText({ message, phoneNumber })
      sendWhatsAppText({ message: 'What is your name?', phoneNumber })

      await this.cacheManager.set(
        phoneNumber,
        JSON.stringify({ stage: 'signup/name', data: {} }), this.secrets.get('THIRTY_MINUTES_IN_SECONDS')
      );
    } else {
      return this.handleNoState({ phoneNumber, profileName });
    }
    return {
      status: 'success',
    };
  };

  handlePaymentNotification = async ({
    phoneNumber,
  }: {
    phoneNumber: string;
  }) => {
    const message = `Our pricing begins at ₦10,000 per month after your 3-day trial period. You have the flexibility to cancel your subscription at any time. Are you ready to continue with creating your meal plan? A charge of ₦100 will be applied now.?\n
1. Accept
2. Decline`;

    return this.sendTextAndSetCache({ message, phoneNumber, stage: 'subscription-acceptance' })
  };

  handleUnknownRequest = async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
    sendWhatsAppText({ phoneNumber, message });
    return {
      status: 'success',
    };
  };

  sendTextAndSetCache = async ({ message, phoneNumber, stage, data = {} }: { message: string, phoneNumber: string, stage: string, data?: any }) => {
    await this.cacheManager.set(phoneNumber, JSON.stringify({ stage, data }), this.secrets.get('THIRTY_MINUTES_IN_SECONDS'));
    sendWhatsAppText({ message, phoneNumber });
    return {
      status: 'success',
    };
  };
}
