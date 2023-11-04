import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { sendWhatsAppText } from '../../helpers';
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

      const message = emailExist ? 'The email already exist, Please enter another email' : `Hey! 🎉🎉 Thank you for signing up to Health Paddy!Get started on your wellness journey by creating your personalized meal plan and get a free 3-day trial period`;
      if (!emailExist) {
        await this.repo.createUser({ email: input, phone: phoneNumber, name: state.data.name as string })
      }
      await sendWhatsAppText({ message, phoneNumber })
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

}