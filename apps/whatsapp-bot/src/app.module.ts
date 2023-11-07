import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

import { AppController } from './app/app.controller';
import { AppRepo } from './app/app.repo';
import { AppService } from './app/app.service';
// import { CronService } from './cron/subscription';
import { GenericService, SignupService, SubscriptionService } from './handlers';
import { CreateMealPlanService, ViewMealPlanService } from './handlers/meal-plan';
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
        console.log(secrets.get('REDIS_URL'));
        
        return {
          isGlobal: true,
          ttl: secrets.get('THIRTY_MINUTES_IN_SECONDS'),
          store: await redisStore({ url: secrets.get('REDIS_URL') }),
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
