import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../app/app.repo';
import { metaTextApiConfig } from '../helpers';

@Injectable()
export class GenericService {
  constructor(
    private repo: AppRepo,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleNoState = async ({ phoneNumber, profileName, customHeader }: { phoneNumber: string, profileName: string, customHeader?: string }) => {
    try {
      const heading = customHeader ? customHeader : `Hi! ${profileName}, I am Health Paddy! Your personal meal planning assistant. How may I be of service to you today?`
      metaTextApiConfig().api.post('', {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: {
          body:
            `${heading}\n
1. Signup
2. Create Meal Plan
3. View My Meal Plan
4. Swap Meal Items
5. Log a Complaint
6. Cancel Subscription`
        },
      })
    } catch (error) {
      console.log({ error });

    }
    const key = phoneNumber
    await this.cacheManager.set(key, JSON.stringify({ stage: 'landing', data: {} }))

    return {
      status: 'success',
    }

  }
}