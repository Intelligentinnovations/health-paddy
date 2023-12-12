/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';

import { delay, sendWhatsAppText } from '../helpers';
import { SecretsService } from '../secrets/secrets.service';
import { MealPlan, State } from '../types';
import { privacyMessage } from '../utils/textMessages';
import { AppRepo } from './app.repo';


DateTime.local().setLocale('en-NG');

@Injectable()
export class GenericService {
  constructor(
    private repo: AppRepo,
    private secrets: SecretsService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
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
        SIGN_UP: '1',
        CREATE_MEAL_PLAN: '2',
        View_MEAL_PLAN: '3',
        SWAP_MEAL_ITEMS: '4',
        VIEW_RECIPE: '5',
        SUPPORT: '6',
        SUBSCRIPTION: '7'
      }

      const protectedSelection = ['2', '3', '4', '5', '7']

      if (!state.user && protectedSelection.includes(input)) {
        return this.handleNoState({
          phoneNumber,
          profileName,
          customHeader: `Looks like you do not have an account as I could not find any account matching your phone number. please select 1 to signup`,
        });
      }

      switch (input) {
        case ROUTE.SIGN_UP:
          if (state.user) {
            await this.handleNoState({
              phoneNumber,
              profileName,
              customHeader:
                'You are already signed up, How else can i be of service',
            });
            break;
          }
          await this.handlePrivacy({ phoneNumber, state });
          break;
        case ROUTE.CREATE_MEAL_PLAN:
          if (state.user?.activityLevel) {
            return this.sendTextAndSetCache({
              message: 'You have already created a meal plan',
              phoneNumber,
              nextStage: 'landing',
              state

            });
          } else {
            const subscription = await this.repo.fetchSubscriptionStatus(state!.user!.id as unknown as string)
            if (subscription?.status !== 'active') {
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


        case ROUTE.View_MEAL_PLAN:
          if (!state.user?.activityLevel) {
            return this.sendTextAndSetCache({
              message: 'Please create a meal plan to proceed',
              phoneNumber,
              nextStage: 'landing',
              state
            });
          }

          if (state.user?.subscriptionStatus !== 'active') {
            return this.handlePaymentNotification({
              phoneNumber,
              state
            })
          }
          return this.generateAndSendMealPlan({
            phoneNumber,
            requiredCalorie: state.user.requiredCalorie!,
            state
          })


        case ROUTE.VIEW_RECIPE:
          if (!state.user?.activityLevel) {
            return this.sendTextAndSetCache({
              message: 'Please create a meal plan to proceed',
              phoneNumber,
              nextStage: 'landing',
              state
            });
          }
          return this.sendTextAndSetCache({
            message: `Kindly choose a specific day to view the meal recipe! 🍽️✨
1. Monday
2. Tuesday
3. Wednesday
4. Thursday
5. Friday
6. Saturday
7. Sunday`,
            phoneNumber,
            nextStage: 'view-recipe/day',
            state
          })

        case ROUTE.SUPPORT:
          return this.sendTextAndSetCache({
            message: `I apologize for any inconvenience you may have experienced. To log a complaint, please contact our support team at support@healthpaddy.com or call our helpline +xxxx . They will be able to assist you further and address your concerns.`,
            phoneNumber,
            nextStage: 'landing',
            state
          })

        case ROUTE.SUBSCRIPTION:
          if (state.user?.subscriptionStatus === 'active') {
            return this.sendTextAndSetCache({
              message: `Manage your subscription\n
1. View Subscription
2. Cancel Subscription `,
              phoneNumber,
              state,
              nextStage: 'subscription-management'
            })
          }
          await this.handleNoState({
            phoneNumber,
            profileName,
            customHeader: `😔😔 I'm sorry, but you don't currently have an active subscription. To enjoy all the benefits, please consider subscribing. How else can I be of service?`
          })
          break;
        default:
          return this.handleNoState({
            phoneNumber,
            profileName,
            customHeader: 'I could not understand your request, lets start again'
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
  }: {
    phoneNumber: string;
    profileName: string;
    customHeader?: string;
  }) => {
    try {
      const heading = customHeader
        ? customHeader
        : `Hi! ${profileName}, I am Health Paddy! Your personal meal planning assistant. How may I be of service to you today?`;
      await sendWhatsAppText({
        phoneNumber, message: `${heading}\n
1. Signup 👤🔐
Create an account with us

2. Create Meal Plan 🍳📝 
Chef Mode: Plan your personalized meal for your health journey in minutes

3. View My Meal Plan 🍽️📋
See what's cooking on your plate today

4. Swap Meal Items 🔀
Don't like a meal item? Shake things up with a variety of interesting alternatives

5. View Your Recipe List 📖🍽️
Your path to wellness starts here

6. Log a Complaint 📢
Help us improve our service: Share your thoughts with us!

7. Manage Subscription
Saying goodbye to our subscription? we understand. But remember, we're always here to support you on your health journey`
      });
      this.cacheManager.del(phoneNumber);
      return {
        status: 'success',
      };
    } catch (error) {
      console.log(error);
    }
  };

  handlePrivacy = async ({ phoneNumber, state }: { phoneNumber: string, state: State }) => {
    const message = privacyMessage
    return this.sendTextAndSetCache({ message, phoneNumber, state, nextStage: 'privacy' })
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
        await this.sendTextAndSetCache({ message: 'What is your name?', phoneNumber, state, nextStage: 'signup/name' });
      } else {
        return this.handleNoState({
          phoneNumber,
          profileName,
          customHeader: 'We respect your decision regarding our privacy policy. If you have any concerns or questions about specific aspects of the policy, please feel free to reach out to our support team'
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
    const subscription = await this.repo.fetchSubscription(state!.user!.id! as unknown as string)
    const text = subscription?.subscriptionStatus === undefined
      ? `We provide a complimentary one-day meal plan after which you can subscribe to gain full access to our services. To get your free one-day meal plan, we'd appreciate it if you could add your payment card.`
      : 'Your subscription has expired 😔. To continue using our service and access all its benefits, please consider renewing your subscription.'
    const message = `Subscription alert\n
${text}

1. Accept
2. Decline`;

    return this.sendTextAndSetCache({ message, phoneNumber, state, nextStage: 'subscription-acceptance' })
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

  async getClosestMealPlan(userCalorie: number) {
    const mealPlans = await this.repo.fetchCalorieRange();

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

  async generateAndSendMealPlan({
    state,
    phoneNumber,
    requiredCalorie
  }: {
    state: State;
    phoneNumber: string;
    requiredCalorie: number
  }) {
    const closestCalorie = await this.getClosestMealPlan(requiredCalorie);
    const subscription = await this.repo.fetchSubscription(state!.user!.id as unknown as string);
    const subscriptionEndDate = DateTime.fromISO(subscription!.endDate!.toISOString().split('T')[0]!);
    const currentDate = DateTime.fromISO(new Date().toISOString().split('T')[0]!);
    const remainingSubscriptionsDays = state!.user!.hasUsedFreeTrial
      ? subscriptionEndDate.diff(currentDate, 'days').toObject().days
      : this.secrets.get('FREE_PLAN_DAYS');
    const numberOfMealPlanToFetch = remainingSubscriptionsDays! > 7 ? 7 : remainingSubscriptionsDays;
    const cacheKey = `${phoneNumber}-meal-plan`;

    const sendPlanMessage = async (plan: MealPlan & { snack?: string }) => {
      let message = `*${plan.day}*\n\n`;
      message += `*Breakfast*: ${plan.breakfast}\n\n`;
      message += `*Snack*: ${plan.snack}\n\n`;
      message += `*Lunch*: ${plan.lunch}\n\n`;
      message += `*Dinner*: ${plan.dinner}\n\n`;
      message += `\nTotal Calories: ${plan.breakfastCalories + plan.snackCalories + plan.lunchCalories + plan.dinnerCalories}`;
      await this.sendTextAndSetCache({ message, phoneNumber, nextStage: 'view-plan', state });
      await delay(300);
    };

    const mealPlan = await this.cacheManager.get<MealPlan[]>(cacheKey);

    if (mealPlan && mealPlan.length) {
      for await (const plan of mealPlan) {
        await sendPlanMessage(plan);
      }
      if (state!.user!.hasUsedFreeTrial) {
        return this.repo.updateUser({
          payload: { hasUsedFreeTrial: true },
          userId: state!.user!.id as unknown as string
        });
      }
    } else {
      if (state.user?.subscriptionStatus === 'expired') {
        return this.handleNoState({
          phoneNumber,
          profileName: state!.user!.name,
          customHeader: `You don't have any active subscription, please subscribe to continue enjoying our service`,
        });
      }

      const fetchedMealPlan = (
        await this.repo.fetchMealPlanByCalorieNeedId({
          calorieNeedId: closestCalorie!.id,
          limit: numberOfMealPlanToFetch!,
        })
      ).rows;

      const ttl = +remainingSubscriptionsDays! * 24 * 60 * 60
      await this.cacheManager.set(cacheKey, fetchedMealPlan, ttl);

      for await (const plan of fetchedMealPlan) {
        await sendPlanMessage(plan);
      }

      if (!state.user!.hasUsedFreeTrial) {
        return this.repo.updateUser({
          payload: { hasUsedFreeTrial: true },
          userId: state.user!.id as unknown as string
        });
      }
    }
  }
}
