import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
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
    console.log('entered service');
    const existing = await this.cacheManager.get<{ name: string }>('test_data');
    if (existing) return existing;

    // await this.messaging.send({
    //   action: 'NOTIFICATION',
    //   body: {
    //     templateId: 'otp',
    //     templateData: { value: '12345' },
    //   },
    // });

    Logger.log('came here');
    await this.cacheManager.set('test_data', { name: 'festus' }, 30000);
    Logger.log('repo data :: ', this.repo.findAll().elseReturn([]));

    return { name: 'jack' };
  }
}
