/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { SecretsService } from '../../secrets/secrets.service';
import { User } from '../../types';
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
    requiredCalorie,
    user

  }: {
    phoneNumber: string;
    requiredCalorie: number
    user: User
  }) => {
    try {
      return this.helper.generateAndSendMealPlan({ requiredCalorie, user, phoneNumber })
    } catch (err) {
      console.log(err);

    }
  }
}