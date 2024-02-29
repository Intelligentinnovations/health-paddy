/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {MESSAGE_MANAGER, Messaging} from '@backend-template/messaging';
import {CACHE_MANAGER} from '@nestjs/cache-manager';
import {Inject, Injectable} from '@nestjs/common';
import {Cache} from 'cache-manager';

import {State} from '../../types';
import {GenericService} from '../general';


@Injectable()
export class ViewMealPlanService {
  constructor(
    private helper: GenericService,
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
      if (state.user?.subscriptionStatus === 'expired' || state.user?.subscriptionStatus === null) {        
        return this.helper.handlePaymentNotification({
          phoneNumber,
          state
        })
      }
      return this.helper.generateAndSendMealPlan({ state, phoneNumber })
    } catch (err) {
      console.log(err);

    }
  }
}
