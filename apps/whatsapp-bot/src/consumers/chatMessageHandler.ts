import { MessageBody } from "@backend-template/types";
import { Injectable } from "@nestjs/common";

import { SignupService } from "../app/auth/signup";
import { FoodBankService } from "../app/food-bank/foodBank";
import { GenericService } from "../app/general";
import { CreateMealPlanService, ViewRecipeService } from "../app/meal-plan";
import { SubscriptionService } from "../app/subscription/subscription";

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
    private foodBank: FoodBankService
  ) {

  }

  public async handleMessages(data: MessageBody) {
    const { input, state, phoneNumber: sender, profileName  } = data.data!;
    if (!state || this.greetings.includes(input.toLowerCase())) {
      return this.generalResponse.handleNoState({
        phoneNumber: sender,
        profileName,
        state
      });
    }

    if (state.stage === "landing") {
      return this.generalResponse.handleLandingPageSelection({
        input,
        phoneNumber: sender,
        profileName,
        state,
      });
    }

    if (state.stage === "privacy") {
      return this.generalResponse.handlePrivacyResponse({
        input,
        phoneNumber: sender,
        profileName,
        state
      });
    }
    if (state.stage.startsWith("signup")) {
      return this.signup.handleSignup({
        input,
        phoneNumber: sender,
        state,
        profileName,
      });
    }
    if (state.stage.startsWith("subscription")) {
      return this.subscriptionService.handleSubscription({
        input,
        phoneNumber: sender,
        state,
        profileName,
      });
    }
    if (state.stage.startsWith("create-meal-plan")) {
      return this.createMealPlan.handleCreateMealPlan({
        input,
        phoneNumber: sender,
        state,
      });
    }
    if (state.stage.startsWith("view-recipe")) {
      return this.recipe.handleViewRecipe({
        input,
        phoneNumber: sender,
        state,
      });
    }
    if (state.stage.startsWith("food-bank")) {
      return this.foodBank.handleFoodBank({
        input,
        phoneNumber: sender,
        state,
      });
    }
    return this.generalResponse.handleNoState({
      phoneNumber: sender,
      profileName,
      customHeader: "I could not understand your request, lets start afresh",
      state
    });
  }
}
