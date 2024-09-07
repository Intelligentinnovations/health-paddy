/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import { DateTime } from "luxon";

import {
  alternatePlanNumbers,
  delay,
  formatCurrency,
  generateMealHeading,
  getDiffBetweenDates,
  getPageSelectionOffset,
  sendWhatsAppImageById,
  sendWhatsAppText
} from "../helpers";
import { MealPlanRepo, SubscriptionRepo, UserRepo } from "../repo";
import { SecretsService } from "../secrets/secrets.service";
import { IUser, MealPlan, State, SubscriptionPlan } from "../types";
import {
  getSelectionMessage,
  getSubscriptionPlanMessage,
  privacyMessage
} from "../utils/textMessages";


DateTime.local().setLocale("en-NG");

@Injectable()
export class GenericService {
  constructor(
    private mealPlanRepo: MealPlanRepo,
    private subscriptionRepo: SubscriptionRepo,
    private userRepo: UserRepo,
    private secrets: SecretsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleLandingPageSelection = async ({
    phoneNumber,
    input,
    profileName,
    state,
  }: {
    phoneNumber: string;
    input: string;
    profileName: string;
    state: State;
  }) => {
    try {
      const ROUTE = {
        CREATE_MEAL_PLAN_OR_LOSE_WEIGHT: 1,
        VIEW_MEAL_PLAN_OR_MAINTAIN_WEIGHT: 2,
        VIEW_RECIPE_OR_GAIN_WEIGHT: 3,
        FOOD_BANK: 4,
        CONTACT_SUPPORT: 5,
        MANAGE_SUBSCRIPTION: 6,
        SHARE_HEALTH_PADDY: 7
      }

      const selectionOffset = getPageSelectionOffset(state);
      const inputWithOffset = Number(input) + selectionOffset;

      switch (inputWithOffset) {
        case ROUTE.CREATE_MEAL_PLAN_OR_LOSE_WEIGHT:
          if (state.user) {
            if (state.user?.subscriptionStatus === "active") {
              return this.sendTextAndSetCache({
                message: "You have already created a meal plan",
                phoneNumber,
                nextStage: "landing",
                state
              });
            } else {
              if (state.user?.subscriptionStatus === "expired") {
                return this.handlePaymentNotification({
                  phoneNumber,
                  state
                })
              }
              const { nextStage: nestStageToResumeFrom, message } = this.getRegistrationStage(state.user) // determined dynamically
              await this.sendTextAndSetCache({
                message: `Hi, ${state.user.firstname} I'd love to chat with you and ask a few questions to help create your meal plan. 😊`,
                phoneNumber,
                nextStage: nestStageToResumeFrom,
                state
              })
              await delay()
              return sendWhatsAppText({ message, phoneNumber })
            }
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: "Lose Weight" });
          }

        case ROUTE.VIEW_MEAL_PLAN_OR_MAINTAIN_WEIGHT:
          if (state.user) {
            if (!state.user?.activityLevel) {
              return this.sendTextAndSetCache({
                message: "Please create a meal plan to proceed",
                phoneNumber,
                nextStage: "landing",
                state
              });
            }

            if (state.user?.subscriptionStatus === "expired" || !state.user?.subscriptionStatus) {
              return this.handlePaymentNotification({
                phoneNumber,
                state
              })
            }
            return this.generateAndSendMealPlan({
              phoneNumber,
              state,
            })
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: "Maintain Weight" });
          }
        case ROUTE.VIEW_RECIPE_OR_GAIN_WEIGHT:
          if (state.user) {
            if (!state.user?.activityLevel) {
              return this.sendTextAndSetCache({
                message: "Please create a meal plan to proceed",
                phoneNumber,
                nextStage: "landing",
                state
              });
            }
            return this.sendTextAndSetCache({
              message: "Kindly choose a specific day to view the meal recipe! 🍽️✨ \n\n1. Monday\n2. Tuesday\n3. Wednesday\n4. Thursday\n5. Friday\n6. Saturday\n7. Sunday",
              phoneNumber,
              nextStage: "view-recipe/day",
              state
            })
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: "Gain Weight" });
          }

        case ROUTE.FOOD_BANK:
          return this.sendTextAndSetCache({
            message: "Please enter a food name (e.g rice)",
            phoneNumber,
            state,
            nextStage: "food-bank"
          })

        case ROUTE.CONTACT_SUPPORT:
          if (state.user) {
            return this.sendTextAndSetCache({
              message: `I apologize for any inconvenience you may have experienced. To log a complaint, please contact our support team at ${this.secrets.get("SUPPORT_EMAIL")}. We will be able to assist you further and address your concerns.`,
              phoneNumber,
              nextStage: "landing",
              state
            })

          } else {
            return this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: "I could not understand your request, lets start again",
              state
            })
          }

        case ROUTE.MANAGE_SUBSCRIPTION:
          if (state.user) {
            if (state.user?.subscriptionStatus === "active") {
              return this.sendTextAndSetCache({
                message: `Manage your subscription\n
1. View Subscription
2. Cancel Subscription`,
                phoneNumber,
                state,
                nextStage: "subscription-management"
              })
            }
            await this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: "😔😔 I'm sorry, but you don't currently have an active subscription. To enjoy all the benefits, please consider subscribing. How else can I be of service?",
              state
            })

          } else {
            return this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: "I could not understand your request, lets start again",
              state
            })
          }
          break
        case ROUTE.SHARE_HEALTH_PADDY:
          await sendWhatsAppText({ message: this.secrets.get("CHAT_LINK"), phoneNumber })
          break
        default:
          return this.handleNoState({
            phoneNumber,
            profileName,
            customHeader: "I could not understand your request, lets start again",
            state
          })
      }
    } catch (err) {
      console.log(err);

    }
  };

  handleNoState = async ({
    phoneNumber,
    profileName,
    customHeader,
    state
  }: {
    phoneNumber: string;
    profileName: string;
    customHeader?: string;
    state: State
  }) => {
    try {
      const message = state.user
        ? `Hello ${profileName}, welcome back to Health Paddy! How can we help you today?`
        : `Hi ${profileName}! This is Health Paddy, your personal meal-planning assistant!\n\nWhat would you like us to help you achieve?`
      const heading = customHeader ? customHeader : message;
      const selectionOffset = getPageSelectionOffset(state);
      await this.sendTextAndSetCache({
        message: getSelectionMessage({ heading, state, selectionOffset }),
        phoneNumber,
        state,
        nextStage: "",
      })
      this.cacheManager.del(phoneNumber);
      return {
        status: true,
        message: "success"
      };
    } catch (error) {
      console.log(error);

      return {
        status: false,
        message: "error in handling no state"
      }
    }
  };

  handlePrivacy = async ({ phoneNumber, state, goal }: { phoneNumber: string, state: State, goal: string }) => {
    const message = privacyMessage(goal)
    return this.sendTextAndSetCache({
      message,
      phoneNumber,
      state,
      nextStage: "privacy",
      data: { goal }
    })
  };

  handlePrivacyResponse = async ({
    phoneNumber,
    input,
    profileName,
    state
  }: {
    phoneNumber: string;
    input: string;
    profileName: string;
    state: State
  }) => {
    try {
      if (input === "1") {
        const message = "Great! 🚀 Thanks for saying 'yes' to our privacy notice. Your data is in good hands! Please follow the prompt below to get signed up";
        await sendWhatsAppText({ message, phoneNumber })
        await delay()
        return this.sendTextAndSetCache({
          message: "What is your first name?",
          phoneNumber,
          state,
          nextStage: "signup/firstname",
          data: { ...state.data }
        });
      } else {
        return this.handleNoState({
          phoneNumber,
          profileName,
          customHeader: "We respect your decision regarding our privacy policy. If you have any concerns or questions about specific aspects of the policy, please feel free to reach out to our support team",
          state
        });
      }
    }
    catch (err) {
      return {
        status: false,
      };

    }
  }
  handlePaymentNotification = async ({
    phoneNumber, state
  }: {
    phoneNumber: string; state: State
  }) => {
    try {
      const nextStage = "subscription-acceptance";
      const firstTimeSubscriber = state?.user?.subscriptionStatus === null;
      const subscriptionPlans = await this.subscriptionRepo.fetchSubscriptionPlans();
      if (firstTimeSubscriber) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const subscriptionMessage = getSubscriptionPlanMessage(subscriptionPlans)
        await this.sendWhatsAppImageByIdAndSetCache({
          phoneNumber,
          imageObjectId: this.secrets.get("SUBSCRIPTION_IMAGE_ID"),
          state,
          nextStage
        })
        await delay();
        return this.sendTextAndSetCache({
          message: subscriptionMessage,
          phoneNumber,
          state,
          data: { subscriptionPlans, isFirstTimeSubscriber: true },
          nextStage
        })
      } else {
        const lastSubscription = await this.subscriptionRepo.fetchUserLastExpiredSubscription(state.user!.id);
        const message = `Subscription alert\n
Your subscription has expired 😔. To continue using our service and access all its benefits, please consider renewing your subscription.\n
*Plan: ${lastSubscription!.planName}*
*Amount Due: ${formatCurrency(Number(lastSubscription!.amount))}*\n
1. Renew with ${lastSubscription!.issuer.toUpperCase()} ending in ${lastSubscription!.last4Digits}
2. Pay with new card
3. Change plan
4. Decline`
        return this.sendTextAndSetCache({
          message,
          phoneNumber,
          state,
          data: {
            isFirstTimeSubscriber: false,
            subscriptionPlans,
            subscription: subscriptionPlans.find(
              (plan => plan.id === lastSubscription!.subscriptionPlanId))
          },
          nextStage
        })
      }
    } catch (error) {
      console.log({ error });
      return {
        status: false,
        message: "error handling payment"
      }

    }
  }

  handleUnknownRequest = async ({ phoneNumber, message }
    : { phoneNumber: string; message: string }) => {
    return sendWhatsAppText({ phoneNumber, message });

  };

  sendTextAndSetCache = ({
    message,
    phoneNumber,
    state,
    nextStage,
    data = {}
  }
    : {
      message: string,
      phoneNumber: string,
      state: State,
      nextStage: string,
      data?: unknown
    }) => {
    try {
      this.cacheManager.set(phoneNumber, {
        user: state.user,
        stage: nextStage,
        data
      });
      return sendWhatsAppText({ message, phoneNumber });
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      return {
        status: false,
        message: "Message not sent"
      };
    }
  };

  sendWhatsAppImageByIdAndSetCache = async ({
    phoneNumber,
    state,
    nextStage,
    data = {},
    imageObjectId
  }
    : {
      phoneNumber: string,
      state: State,
      nextStage: string,
      data?: unknown;
      imageObjectId: string
    }) => {
    try {
      await this.cacheManager.set(phoneNumber, { ...state, stage: nextStage, data });
      return sendWhatsAppImageById({ phoneNumber, imageObjectId });
    } catch (error: any) {
      return {
        status: false,
        message: error.message
      }
    }
  };


  async getClosestMealPlan(userCalorie: number) {
    const appWeek = getDiffBetweenDates({
      startDate: new Date(this.secrets.get("WHATSAPP_BOT_START_DATE")),
      endDate: new Date(),
      timePeriod: "weeks"
    })

    const planNo = alternatePlanNumbers(appWeek)
    const mealPlans = await this.mealPlanRepo.fetchCalorieRange(planNo);
    let closestMealPlan = mealPlans[0];
    let minDifference = Math.abs(+userCalorie - closestMealPlan!.calories);

    mealPlans.forEach(plan => {
      const difference = Math.abs(+userCalorie - plan.calories!);
      if (difference < minDifference) {
        minDifference = difference;
        closestMealPlan = plan;
      }
    });
    return closestMealPlan
  }

  async getMealPlan({ state, numberOfMealPlans }: { state: State; numberOfMealPlans: number }) {
    try {
      const cacheKey = `${state!.user!.phone}-meal-plan`;
      const mealPlan = await this.cacheManager.get<MealPlan[]>(cacheKey);
      if (mealPlan) {
        return mealPlan
      }
      let fetchedMealPlan: MealPlan[];
      const currentMealPlan = await this.mealPlanRepo.fetchCurrentMealPlan(state.user!.id);
      if (currentMealPlan) {
        fetchedMealPlan = JSON.parse(currentMealPlan.plan)
      } else {
        const user = await this.userRepo.findUserByEmail(state.user!.email as string)
        const closestCalorie = await this.getClosestMealPlan(user!.requiredCalorie as number);
        const subscription = await this.subscriptionRepo.fetchSubscription(state!.user!.id as unknown as string);
        let numberOfMealPlanToFetch = numberOfMealPlans;

        if (state.user?.subscriptionStatus === "active") {
          const subscriptionEndDate = DateTime.fromISO(subscription!.endDate!.toISOString().split("T")[0]!);
          const currentDate = DateTime.fromISO(new Date().toISOString().split("T")[0]!);
          const remainingSubscriptionsDays = subscriptionEndDate.diff(currentDate, "days").toObject().days as number
          numberOfMealPlanToFetch = remainingSubscriptionsDays! > numberOfMealPlans ? numberOfMealPlans : remainingSubscriptionsDays;
        }

        fetchedMealPlan = (
          await this.mealPlanRepo.fetchMealPlanByCalorieNeedId({
            calorieNeedId: closestCalorie!.id,
            limit: numberOfMealPlanToFetch!,
          })
        ).rows;
        const today = DateTime.now();
        await this.mealPlanRepo.saveUserMealPlan({
          userId: state.user!.id,
          plan: JSON.stringify(fetchedMealPlan),
          startDate: today.toJSDate(),
          endDate: today.plus({ days: numberOfMealPlanToFetch }).toJSDate()
        })
        await this.cacheManager.set(cacheKey, fetchedMealPlan);
      }
      return fetchedMealPlan
    }
    catch (error) {
      console.log(error)
    }
  }


  async generateAndSendMealPlan({
    state,
    phoneNumber,
  }: {
    state: State;
    phoneNumber: string;
  }) {
    try {
      type MealPlanWithSnack = MealPlan & { snack?: string };
      const formatMessage = (plan: MealPlanWithSnack[]) => {
        let message = "";
        for (const meal of plan) {
          const heading = generateMealHeading(meal.day)
          message += `*${heading}*\n\n`;
          message += `*Breakfast*: ${meal.breakfast}\n\n`;
          message += `*Snack*: ${meal.snack}\n\n`;
          message += `*Lunch*: ${meal.lunch}\n\n`;
          message += `*Dinner*: ${meal.dinner}\n\n`;
          message += `Total Calories: ${meal.breakfastCalories + meal.snackCalories + meal.lunchCalories + meal.dinnerCalories}\n\n`;
          message += "\n";
        }
        return message.trim();
      };

      const numberOfMealPlans = state!.user!.hasUsedFreeMealPlan ? 7 : 1;
      const mealPlan = await this.getMealPlan({ state, numberOfMealPlans });

      const splitMealPlan = this.splitArray(mealPlan!)
      for (const mealPlan of splitMealPlan!) {
        const mealPlanSchedule = formatMessage(mealPlan);
        await this.sendTextAndSetCache({
          message: mealPlanSchedule,
          phoneNumber,
          nextStage: "view-plan",
          state
        });
      }

      if (!state.user?.hasUsedFreeMealPlan) {
        await this.userRepo.updateUser({
          payload: {
            hasUsedFreeMealPlan: true
          },
          userId: state.user?.id as string
        })
      }

    }
    catch (error) {
      console.log(error, "show error")
    }
  }

  async handleChangePlan({ phoneNumber, state, subscriptionPlans }:
    { phoneNumber: string; state: State, subscriptionPlans: SubscriptionPlan[] }) {
    try {
      return this.sendTextAndSetCache({
        message: getSubscriptionPlanMessage(subscriptionPlans),
        phoneNumber,
        state,
        data: { subscriptionPlans, isFirstTimeSubscriber: false },
        nextStage: "subscription-change-expired-plan"
      })

    }
    catch (error) {
      console.log(error)
      return {
        status: false,
        message: "error handling change of plan"
      };
    }
  }

  getRegistrationStage(user: IUser) {
    const basePath = "create-meal-plan"
    const { dateOfBirth, sex, height, weight } = user;
    if (!dateOfBirth) return {
      message: "May i know your date of birth? e.g ( 01/10/2000 )",
      nextStage: `${basePath}/age`,
    }
    if (!sex) return {
      message: `Thanks! could you share your gender with me?\n
1. Male
2. Female`,
      nextStage: `${basePath}/gender`,
    }
    if (!height) return {
      message: "Perfect!, May I ask for your height in feet, for example, in the format \"5f11\" or 5'11?",
      nextStage: `${basePath}/height`,
    }
    if (!weight) return {
      message: "Excellent! Would you be willing to tell me your weight in KG? (e.g 70)",
      nextStage: `${basePath}/weight`,
    }
    return {
      message: `What health goal do you want to achieve ?\n
1. Maintain Weight
2. Lose Weight
3. Gain Weight`,
      nextStage: `${basePath}/goal`,
    }

  }

  splitArray<T>(arr: T[]): [T[], T[]] {
    const midpoint = Math.ceil(arr.length / 2);
    const firstHalf = arr.slice(0, midpoint);
    const secondHalf = arr.slice(midpoint);
    return [firstHalf, secondHalf];
  }

}
