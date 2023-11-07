/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { AppRepo } from '../../app/app.repo';
import { SecretsService } from '../../secrets/secrets.service';
import { PaymentService } from '../../services/paystack';
import { State, User } from '../../types';
import { GenericService } from '../general';

@Injectable()
export class ViewMealPlanService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private secrets: SecretsService,
    private payment: PaymentService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleViewMealPlan = async ({
    phoneNumber,
    profileName,
    state,
    input,
  }: {
    phoneNumber: string;
    state: State;
    input: number;
    profileName: string;
  }) => {
    try {
      const { stage } = state;

      if (stage === 'view-meal-plan') {
        const message = `Coming soon`
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'view-plan', data: { age: input }
        })
      }

    } catch (err) {
      console.log(err);

    }
  }
}