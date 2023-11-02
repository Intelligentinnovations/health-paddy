import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { GenericService } from '../handlers/general';
import { SignupService } from '../handlers/signup/signup';
import { State, User } from '../types';
import { AppRepo } from './app.repo';

@Injectable()
export class AppService {
  constructor(
    private generalResponse: GenericService,
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
        const profileName = body.entry[0].changes[0].value.contacts[0].profile.name;

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
          const result = await this.generalResponse.handleNoState({ phoneNumber: sender, profileName });
          return result;
        }

        if (state.stage === 'landing') {
          const result = await this.signup.handleLandingPageSelection({ input: msg_body, phoneNumber: sender, profileName, state })
          return result
        }
        if (state.stage === 'privacy') {
          const result = await this.signup.handlePrivacyResponse({ input: msg_body, phoneNumber: sender, profileName })
          return result
        }
        if (state.stage.startsWith('signup')) {
          const result = await this.signup.handleSignup({ input: msg_body, phoneNumber: sender, state, profileName })
          return result
        }

        this.generalResponse.handleNoState({ phoneNumber: sender, profileName })

      }
    } else {
      return {
        status: 'not-found'
      }
    }

  }
}
