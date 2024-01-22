/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { SecretsService } from '../../secrets/secrets.service';
import { State } from '../../types';
import { AppRepo } from '../app.repo';
import { GenericService } from '../general';


@Injectable()
export class ViewMealPlanService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private secrets: SecretsService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleViewMealPlan = async ({
    phoneNumber,
    state
  }: {
    phoneNumber: string;
    state: State
  }) => {
    try {      
      return this.helper.generateAndSendMealPlan({ state, phoneNumber })
    } catch (err) {
      console.log(err);

    }
  }
} 