import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { delay, sendWhatsAppText } from '../../helpers';
import { State } from '../../types';
import { EmailSchema } from '../../utils/schema';
import { StringSchema } from '../../utils/schema/auth.schema';
import { AppRepo } from '../app.repo';
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
    try {
      if (state.stage === 'signup/name') {
        StringSchema.parse(input)
        return this.helper.sendTextAndSetCache({
          message: `Great ${input}, Please tell me your email`,
          phoneNumber,
          nextStage: 'signup/email',
          state,
          data: { name: input }
        })
      }
      if (state.stage === 'signup/email') {
        try {
          EmailSchema.parse({ email: input })
        } catch (error) {
          await sendWhatsAppText({ message: `Please enter a valid email`, phoneNumber })
          return { status: 'success' }
        }
        const emailExist = await this.repo.findUserByEmail(input);
        if (!emailExist) {
          await this.repo.createUser({ email: input, phone: phoneNumber, name: state.data.name as string })
        }
        if (emailExist) {
          const message = 'The email already exist, Please enter another email';
          await sendWhatsAppText({ message, phoneNumber })
          return {
            status: 'success',
          };
        }
        await delay()
        return this.helper.handleNoState({
          phoneNumber,
          profileName,
          customHeader: `Hey! 🎉🎉 Thank you for signing up to Health Paddy!Get started on your wellness journey by creating your personalized meal plan and get a free day meal plan`
        })
      }
      return this.helper.handleNoState({
        phoneNumber,
        profileName,
        customHeader: 'Could not understand your request, lets start again'
      });
    }
    catch (e) {
      console.log(e);

    }

  }
}
