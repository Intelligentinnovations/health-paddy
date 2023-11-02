import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { metaTextApiConfig } from '../../helpers';
import { State } from '../../types';
import { GenericService } from '../general';

@Injectable()
export class SignupService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handlePrivacy = async (phoneNumber: string) => {
    metaTextApiConfig().api.post('', {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      type: "text",
      to: phoneNumber,
      text: {
        preview_url: false,
        body: `Privacy Notice
                
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
2. Reject`
      },
    })
    await this.cacheManager.set(phoneNumber, JSON.stringify({ stage: 'privacy' }))
    return {
      status: 'success',
    }
  }

  handlePrivacyResponse = async ({ phoneNumber, input, profileName }: { phoneNumber: string; input: string; profileName: string }) => {

    const acceptanceMessage = `Great! 🚀 Thanks for saying 'yes' to our privacy notice. Your data is in good hands! Please follow the prompt below to get signup`
    if (input === '1') {
      metaTextApiConfig().api.post('', {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: {
          body: acceptanceMessage
        },
      })

      metaTextApiConfig().api.post('', {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: {
          body: "Please enter your name"
        },
      })

      await this.cacheManager.set(phoneNumber, JSON.stringify({ stage: 'signup/name', data: {} }))

    } else {
      this.helper.handleNoState({ phoneNumber, profileName })
      await this.cacheManager.set(phoneNumber, JSON.stringify({ stage: 'landing', data: {} }))
    }
    return {
      status: 'success',
    }
  }

  handleSignup = async ({
    phoneNumber,
    input,
    state,
    profileName,
  }: {
    phoneNumber: string;
    input: string;
    state: State;
    profileName: string;
  }) => {

    if (state.stage === 'signup/name') {
      await this.cacheManager.set(phoneNumber, JSON.stringify({ stage: 'signup/email', data: { name: input } }));
      return {
        status: 'success',
      };
    }
    if (state.stage === 'signup/email') {
      const emailExist = await this.repo.findUserByEmail(input);

      const message = emailExist ? 'The email already exist, Please enter another email' : `Congratulations! 🎉 You're all set and part of our community. Welcome aboard! Feel free to explore and enjoy all the great features we have in store for you`;
      if (!emailExist) {
        await this.repo.createUser({ email: input, phone: phoneNumber, name: state.data.name as string })
      }
      await metaTextApiConfig().api.post('', {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        text: {
          body: message
        },
      });
      if (emailExist) return {
        status: 'success',
      };
      this.helper.handleNoState({ phoneNumber, profileName })
      return {
        status: 'success',
      };
    }
    this.helper.handleNoState({ phoneNumber, profileName });
    return {
      status: 'success',
    };
  };


  handleLandingPageSelection = async ({ phoneNumber, input, profileName, state }: { phoneNumber: string, input: string, profileName: string, state: State }) => {
    switch (input) {
      case '1':
        if (state.user) {
          this.helper.handleNoState({ phoneNumber, profileName, customHeader: 'You are already signed up, How else can be of service' })
          break
        }
        this.handlePrivacy(phoneNumber)
        break;
      case '2':

        break;

      default:

        break;
    }

    return {
      status: 'success',
    }

  }

}