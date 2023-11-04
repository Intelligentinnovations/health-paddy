import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../app/app.repo';
import { sendWhatsAppText } from '../helpers';
import { State } from '../types';

@Injectable()
export class GenericService {
  constructor(
    private repo: AppRepo,
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
    switch (input) {
      case '1':
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

      case '2': //create meal plan
        if (!state.user) {
          this.handleNoState({
            phoneNumber,
            profileName,
            customHeader: `Looks like you do not have an account as I could not find any account matching your phone number.
please select 1 to signup
`,
          });
          break;
        }
        if (state.user.subscriptionStatus !== 'ACTIVE') return this.handlePaymentNotification({ phoneNumber })
        //  create meal plan here
        sendWhatsAppText({ message: 'Coming soon', phoneNumber })
        break;
      default:
        break;
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
      JSON.stringify({ stage: 'landing', data: {} })
    );

    return {
      status: 'success',
    };
  };

  handlePrivacy = async (phoneNumber: string) => {
    sendWhatsAppText({
      phoneNumber, message: `Privacy Notice
                
    We are committed to protecting your privacy. This privacy notice explains how we collect, use, and protect your personal data when you interact with us.
                    
    We may collect the following personal data:
    - Name
    - Age
    - Gender
    - Height
    - Weight
    - Activity level
    - Dietary preferences
    
    How We Use Your Information
    We use the information you provide to:
    - Calculate your estimated daily calorie requirements
    - Provide personalized nutrition and fitness recommendations
    - Improve our services
    - Respond to your inquiries
    
    Data Security
    We prioritize the security of your personal data. We implement measures to protect your data from unauthorized access, disclosure, alteration, and destruction.
    
    Sharing Your Information
    We do not share your personal information with third parties. Your data is used solely for the purpose of providing you with nutrition and fitness recommendations.
    
    Consent
    By using our WhatsApp bot, you consent to the collection and use of your personal data as described in this privacy notice.
    
    1. Accept
    2. Reject`});
    await this.cacheManager.set(
      phoneNumber,
      JSON.stringify({ stage: 'privacy' })
    );
    return {
      status: 'success',
    };
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
      sendWhatsAppText({ message, phoneNumber })
      sendWhatsAppText({ message: 'What is your name?', phoneNumber })

      await this.cacheManager.set(
        phoneNumber,
        JSON.stringify({ stage: 'signup/name', data: {} })
      );
    } else {
      this.handleNoState({ phoneNumber, profileName });
      await this.cacheManager.set(
        phoneNumber,
        JSON.stringify({ stage: 'landing', data: {} })
      );
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
    sendWhatsAppText({ message, phoneNumber })

    await this.cacheManager.set(
      phoneNumber,
      JSON.stringify({ stage: 'subscription-acceptance', data: {} })
    );
    return {
      status: 'success',
    };
  };

  handleUnknownRequest = async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
    sendWhatsAppText({ phoneNumber, message });
    return {
      status: 'success',
    };
  };
}
