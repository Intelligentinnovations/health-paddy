import { MessageBody } from "@backend-template/types";
import {Inject, Injectable} from "@nestjs/common";

import { SignupService } from "../app/auth/signup";
import { FoodBankService } from "../app/food-bank/foodBank";
import { GenericService } from "../app/general";
import { CreateMealPlanService, ViewRecipeService } from "../app/meal-plan";
import { SubscriptionService } from "../app/subscription/subscription";
import { State } from "../types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";



@Injectable()
export class ChatMessageHandler {
  private greetings = [
    "hey",
    "hello",
    "hi",
    "good morning",
    "good afternoon",
    "good evening",
    "hi health paddy",
    "hello health paddy"
  ]

  constructor(
    private generalResponse: GenericService,
    private subscriptionService: SubscriptionService,
    private signup: SignupService,
    private createMealPlan: CreateMealPlanService,
    private recipe: ViewRecipeService,
    private foodBank: FoodBankService,
  @Inject(CACHE_MANAGER) private cacheManager: Cache

) {

  }

  public async handleMessages(data: MessageBody): Promise<{ status: boolean; message?: string }> {
    const { data: messageData } = data;
    const { input, state, phoneNumber: sender, profileName } = messageData ?? {};
    const defaultParams = {
      input: input ?? "",
      phoneNumber: sender ?? "",
      profileName: profileName ?? "",
      state,
    };
    if (!state || (input && this.greetings.includes(input.toLowerCase()))) {
      return this.generalResponse.handleNoState({
        ...defaultParams,
        state: state as State
      });
    }

    const stageHandlers = {
      landing: () => this.generalResponse.handleLandingPageSelection({...defaultParams, state: defaultParams.state as State}),
      privacy: () => this.generalResponse.handlePrivacyResponse({...defaultParams, state: defaultParams.state as State}),
      signup: () => this.signup.handleSignup({...defaultParams, state: defaultParams.state as State}),
      subscription: () => this.subscriptionService.handleSubscription({...defaultParams, state: defaultParams.state as State}),
      "create-meal-plan": () => this.createMealPlan.handleCreateMealPlan({...defaultParams, state: defaultParams.state as State}),
      "view-recipe": () => this.recipe.handleViewRecipe({...defaultParams, state: defaultParams.state as State}),
      "food-bank": () => this.foodBank.handleFoodBank({...defaultParams, state: defaultParams.state as State}),
    };

    for (const [prefix, handler] of Object.entries(stageHandlers)) {
      if (state.stage.startsWith(prefix)) {
        const isProcessingCacheKey = `${sender}-is-processing`
        await this.cacheManager.set(isProcessingCacheKey, true);
        const result = await handler();
        if (result) {
          return {
            status: result.status,
            ...(("message" in result) && { message: result.message })
          };
        }
      }
    }

    return this.generalResponse.handleNoState({
      ...defaultParams,
      customHeader: "I could not understand your request, let's start afresh",
      state: state as State
    });
  }
}
