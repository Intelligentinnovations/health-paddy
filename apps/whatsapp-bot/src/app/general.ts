/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';

import {
  alternatePlanNumbers,
  delay,
  formatCurrency,
  generateMealHeading,
  getPageSelectionOffset,
  getWeeksBetweenDates,
  sendWhatsAppCTA,
  sendWhatsAppText
} from '../helpers';
import { SecretsService } from '../secrets/secrets.service';
import { MealPlan, State, SubscriptionPlan } from '../types';
import { getSelectionMessage, getSubscriptionPlanMessage, privacyMessage } from '../utils/textMessages';
import { AppRepo } from './app.repo';


DateTime.local().setLocale('en-NG');

@Injectable()
export class GenericService {
  constructor(
    private repo: AppRepo,
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
        CREATE_MEAL_PLAN_OR_LOOSE_WEIGHT: 1,
        VIEW_MEAL_PLAN_OR_MAINTAIN_WEIGHT: 2,
        VIEW_RECIPE_OR_LOOSE_WEIGHT: 3,
        CONTACT_SUPPORT: 4,
        MANAGE_SUBSCRIPTION: 5
      }

      const selectionOffset = getPageSelectionOffset(state);
      const inputWithOffset = Number(input) + selectionOffset;

      console.log({ inputWithOffset });

      switch (inputWithOffset) {
        case ROUTE.CREATE_MEAL_PLAN_OR_LOOSE_WEIGHT:
          if (state.user) {
            if (state.user?.subscriptionStatus === 'active') {
              return this.sendTextAndSetCache({
                message: 'You have already created a meal plan',
                phoneNumber,
                nextStage: 'landing',
                state
              });
            } else {
              if (state.user?.subscriptionStatus === 'expired') {
                return this.handlePaymentNotification({
                  phoneNumber,
                  state
                })
              }
              await this.sendTextAndSetCache({
                message: `Hi, ${state.user?.name} I'd love to chat with you and ask a few questions to help create your personalized meal plan. 😊`,
                phoneNumber,
                nextStage: 'create-meal-plan/age',
                state
              })
              await delay()
              await sendWhatsAppText({ message: 'Please tell me your age', phoneNumber })
              break;
            }
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: 'Loose Weight' });
          }

        case ROUTE.VIEW_MEAL_PLAN_OR_MAINTAIN_WEIGHT:
          if (state.user) {
            if (!state.user?.activityLevel) {
              return this.sendTextAndSetCache({
                message: 'Please create a meal plan to proceed',
                phoneNumber,
                nextStage: 'landing',
                state
              });
            }

            if (state.user?.subscriptionStatus === 'expired' || !state.user?.subscriptionStatus) {
              return this.handlePaymentNotification({
                phoneNumber,
                state
              })
            }
            return this.generateAndSendMealPlan({
              phoneNumber,
              state
            })
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: 'Maintain Weight' });
          }
        case ROUTE.VIEW_RECIPE_OR_LOOSE_WEIGHT:
          if (state.user) {
            if (!state.user?.activityLevel) {
              return this.sendTextAndSetCache({
                message: 'Please create a meal plan to proceed',
                phoneNumber,
                nextStage: 'landing',
                state
              });
            }
            return this.sendTextAndSetCache({
              message: `Kindly choose a specific day to view the meal recipe! 🍽️✨ \n1. Monday\n2. Tuesday\n3. Wednesday\n4. Thursday\n5. Friday\n6. Saturday\n7. Sunday`,
              phoneNumber,
              nextStage: 'view-recipe/day',
              state
            })
          } else {
            return this.handlePrivacy({ phoneNumber, state, goal: 'Gain Weight' });
          }


        case ROUTE.CONTACT_SUPPORT:
          if (state.user) {
            return this.sendTextAndSetCache({
              message: `I apologize for any inconvenience you may have experienced. To log a complaint, please contact our support team at support@healthpaddy.com or call our helpline +xxxx . They will be able to assist you further and address your concerns.`,
              phoneNumber,
              nextStage: 'landing',
              state
            })

          } else {
            return this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: 'I could not understand your request, lets start again',
              state
            })
          }

        case ROUTE.MANAGE_SUBSCRIPTION:
          if (state.user) {
            if (state.user?.subscriptionStatus === 'active') {
              return this.sendTextAndSetCache({
                message: `Manage your subscription\n 
1. View Subscription
2. Cancel Subscription`,
                phoneNumber,
                state,
                nextStage: 'subscription-management'
              })
            }
            await this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: `😔😔 I'm sorry, but you don't currently have an active subscription. To enjoy all the benefits, please consider subscribing. How else can I be of service?`,
              state
            })

          } else {
            return this.handleNoState({
              phoneNumber,
              profileName,
              customHeader: 'I could not understand your request, lets start again',
              state
            })
          }
          break
        default:
          return this.handleNoState({
            phoneNumber,
            profileName,
            customHeader: 'I could not understand your request, lets start again',
            state
          })
      }

      return {
        status: 'success',
      };
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
      console.log({ selectionOffset });
      await this.sendTextAndSetCache({
        message: getSelectionMessage({ heading, state, selectionOffset }),
        phoneNumber,
        state,
        nextStage: "",
      })
      this.cacheManager.del(phoneNumber);
      return {
        status: 'success',
      };
    } catch (error) {
      console.log(error);
    }
  };

  handlePrivacy = async ({ phoneNumber, state, goal }: { phoneNumber: string, state: State, goal: string }) => {
    const message = privacyMessage(goal)
    return this.sendTextAndSetCache({
      message,
      phoneNumber,
      state,
      nextStage: 'privacy',
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
      if (input === '1') {
        const message = `Great! 🚀 Thanks for saying 'yes' to our privacy notice. Your data is in good hands! Please follow the prompt below to get signed up`;
        await sendWhatsAppText({ message, phoneNumber })
        await delay()
        await this.sendTextAndSetCache({ message: 'What is your name?', phoneNumber, state, nextStage: 'signup/name', data: { ...state.data } });
      } else {
        return this.handleNoState({
          phoneNumber,
          profileName,
          customHeader: 'We respect your decision regarding our privacy policy. If you have any concerns or questions about specific aspects of the policy, please feel free to reach out to our support team',
          state
        });
      }
      return {
        status: 'success',
      };
    }
    catch (err) {
      console.log(err);

    }
  }
  handlePaymentNotification = async ({
    phoneNumber, state
  }: {
    phoneNumber: string; state: State
  }) => {
    const nextStage = 'subscription-acceptance';
    const firstTimeSubscriber = state?.user?.subscriptionStatus === null;
    const subscriptionPlans = await this.repo.fetchSubscriptionPlans();
    if (firstTimeSubscriber) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const subscriptionMessage = getSubscriptionPlanMessage(subscriptionPlans)
      return this.sendCallToActionAndSetCache({
        message: subscriptionMessage,
        phoneNumber,
        state,
        link: 'https://google.com',
        callToActionText: 'View Plans',
        data: { subscriptionPlans, isFirstTimeSubscriber: true },
        nextStage
      })
    } else {
      const lastSubscription = await this.repo.fetchUserLastExpiredSubscription(state.user!.id);
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
          subscription: subscriptionPlans.find((plan => plan.id === lastSubscription!.subscriptionPlanId))
        },
        nextStage
      })
    }
  };

  handleUnknownRequest = async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
    await sendWhatsAppText({ phoneNumber, message });
    return {
      status: 'success',
    };
  };

  sendTextAndSetCache = async ({ message, phoneNumber, state, nextStage, data = {} }
    : { message: string, phoneNumber: string, state: State, nextStage: string, data?: unknown }) => {
    try {
      await this.cacheManager.set(phoneNumber, { ...state, stage: nextStage, data });
      await sendWhatsAppText({ message, phoneNumber });
      return {
        status: 'success',
      };
    } catch (error) {
      console.log(error);
    }
  };

  sendCallToActionAndSetCache = async ({ message, phoneNumber, state, nextStage, data = {}, link, callToActionText = 'Subscribe' }
    : { message: string, phoneNumber: string, state: State, nextStage: string, data?: unknown; link: string, callToActionText?: string }) => {
    try {
      await this.cacheManager.set(phoneNumber, { ...state, stage: nextStage, data });
      await sendWhatsAppCTA({ message, phoneNumber, link, callToActionText });
      return {
        status: 'success',
      };
    } catch (error) {
      console.log(error);
    }
  };

  async getClosestMealPlan(userCalorie: number) {
    const appWeek = getWeeksBetweenDates({
      startDate: new Date(this.secrets.get('WHATSAPP_BOT_START_DATE')),
      endDate: new Date()
    })

    const planNo = alternatePlanNumbers(appWeek)
    const mealPlans = await this.repo.fetchCalorieRange(planNo);
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

  async getMealPlan(state: State) {
    const cacheKey = `${state!.user!.phone}-meal-plan`;
    const mealPlan = await this.cacheManager.get<MealPlan[]>(cacheKey);
    if (mealPlan) {
      return mealPlan
    }
    let fetchedMealPlan: MealPlan[];
    const currentMealPlan = await this.repo.fetchCurrentMealPlan(state.user!.id);
    if (currentMealPlan) {
      fetchedMealPlan = JSON.parse(currentMealPlan.plan)
    } else {
      const closestCalorie = await this.getClosestMealPlan(state!.user!.requiredCalorie!);
      const subscription = await this.repo.fetchSubscription(state!.user!.id as unknown as string);
      const subscriptionEndDate = DateTime.fromISO(subscription!.endDate!.toISOString().split('T')[0]!);
      const currentDate = DateTime.fromISO(new Date().toISOString().split('T')[0]!);

      const remainingSubscriptionsDays = subscriptionEndDate.diff(currentDate, 'days').toObject().days
      const numberOfMealPlanToFetch = remainingSubscriptionsDays! > 8 ? 8 : remainingSubscriptionsDays;
      fetchedMealPlan = (
        await this.repo.fetchMealPlanByCalorieNeedId({
          calorieNeedId: closestCalorie!.id,
          limit: numberOfMealPlanToFetch!,
        })
      ).rows;
      const today = new Date();
      await this.repo.saveUserMealPlan({
        userId: state.user!.id,
        plan: JSON.stringify(fetchedMealPlan),
        startDate: today,
        endDate: today
      })
      await this.cacheManager.set(cacheKey, fetchedMealPlan);
    }
    return fetchedMealPlan
  }


  async generateAndSendMealPlan({
    state,
    phoneNumber,
  }: {
    state: State;
    phoneNumber: string;
  }) {
    const formatMessage = (plan: MealPlan & { snack?: string }) => {
      const heading = generateMealHeading(plan.day)
      let message = `*${heading}*\n\n`;
      message += `*Breakfast*: ${plan.breakfast}\n\n`;
      message += `*Snack*: ${plan.snack}\n\n`;
      message += `*Lunch*: ${plan.lunch}\n\n`;
      message += `*Dinner*: ${plan.dinner}\n\n`;
      message += `\nTotal Calories: ${plan.breakfastCalories + plan.snackCalories + plan.lunchCalories + plan.dinnerCalories}\n\n`;
      return message

    };

    const mealPlan = await this.getMealPlan(state)
    let mealPlanSchedule = '';
    for (const plan of mealPlan) {
      mealPlanSchedule += formatMessage(plan);
    }
    await this.sendTextAndSetCache({ message: mealPlanSchedule, phoneNumber, nextStage: 'view-plan', state });
  }



  handleChangePlan({ phoneNumber, state, subscriptionPlans }: { phoneNumber: string; state: State, subscriptionPlans: SubscriptionPlan[] }) {
    return this.sendTextAndSetCache({
      message: getSubscriptionPlanMessage(subscriptionPlans),
      phoneNumber,
      state,
      data: { subscriptionPlans, isFirstTimeSubscriber: false },
      nextStage: "subscription-change-expired-plan"
    })
  }

}
