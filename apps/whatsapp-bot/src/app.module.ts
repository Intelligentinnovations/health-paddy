import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { redisStore } from "cache-manager-redis-yet";

import { AppController } from "./app/app.controller";
import { AppService } from "./app/app.service";
import { SignupService } from "./app/auth/signup"
import {FoodBankService} from "./app/food-bank/foodBank"
// import { CronService } from './cron/subscription';
import { GenericService, } from "./app/general";
import { CreateMealPlanService, ViewMealPlanService, ViewRecipeService } from "./app/meal-plan";
import {HandlePayment} from "./app/payment/payment.service";
import { SubscriptionService } from "./app/subscription/subscription"
import { ChatMessageHandler } from "./consumers/chatMessageHandler";
import { ConsumerService } from "./consumers/consumerService"
import { LibrariesModule } from "./libraries/libraries.module";
import { CardRepo,MealPlanRepo, SubscriptionRepo, TransactionRepo, UserRepo } from "./repo";
import { SecretsModule } from "./secrets/secrets.module";
import { SecretsService } from "./secrets/secrets.service";
import { PaymentService } from "./services/paystack";


@Module({
  imports: [
    LibrariesModule,
    SecretsModule,
    CacheModule.registerAsync({
      useFactory: async (secrets: SecretsService) => {
        return {
          isGlobal: true,
          store: await redisStore({ ttl: secrets.get("THIRTY_MINUTES_IN_SECONDS"), url: secrets.get("REDIS_URL") }),
        };
      },
      inject: [SecretsService],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserRepo,
    CardRepo,
    MealPlanRepo,
    TransactionRepo,
    SubscriptionRepo,
    GenericService,
    SignupService,
    SubscriptionService,
    PaymentService,
    CreateMealPlanService,
    ViewMealPlanService,
    ViewRecipeService,
    ConsumerService,
    ChatMessageHandler,
    FoodBankService,
    HandlePayment
    // CronService
  ],
})
export class AppModule {
}
