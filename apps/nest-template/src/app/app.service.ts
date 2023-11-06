import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from './app.repo';

@Injectable()
export class AppService {
  constructor(
    private repo: AppRepo,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async getData() {
    await this.cacheManager.set('key', 'val');
    await this.cacheManager.get('key');

    await this.messaging.send({
      action: 'NOTIFICATION',
      body: {
        templateId: 'otp',
        templateData: { value: '12345' },
      },
    });

    return { name: 'jack' };
  }
}
