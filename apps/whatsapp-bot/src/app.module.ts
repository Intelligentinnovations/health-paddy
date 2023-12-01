import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

import { AppController } from './app/app.controller';
import { AppRepo } from './app/app.repo';
import { AppService } from './app/app.service';
import { SignupService } from './app/auth/signup'
// import { CronService } from './cron/subscription';
import { GenericService, } from './app/general';
import { CreateMealPlanService, ViewMealPlanService } from './app/meal-plan';
import { SubscriptionService } from './app/subscription/subscription'
import { LibrariesModule } from './libraries/libraries.module';
import { SecretsModule } from './secrets/secrets.module';
import { SecretsService } from './secrets/secrets.service';
import { PaymentService } from './services/paystack';


@Module({
  imports: [
    LibrariesModule,
    SecretsModule,
    CacheModule.registerAsync({
      useFactory: async (secrets: SecretsService) => {
        return {
          isGlobal: true,
          store: await redisStore({ttl: secrets.get('THIRTY_MINUTES_IN_SECONDS'), url: secrets.get('REDIS_URL') }),
        };
      },
      inject: [SecretsService],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppRepo,
    GenericService,
    SignupService,
    SubscriptionService,
    PaymentService,
    CreateMealPlanService,
    ViewMealPlanService,
    // CronService
  ],
})
export class AppModule { }
