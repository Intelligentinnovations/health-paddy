/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { DateTime } from 'luxon';

import { AppRepo } from '../app/app.repo';
import { delay, sendWhatsAppText } from '../helpers';
import { SecretsService } from '../secrets/secrets.service';
import { MealPlan, State, User } from '../types';


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

    const ROUTE = {
      SIGN_UP: '1',
      CREATE_MEAL_PLAN: '2',
      View_MEAL_PLAN: '3',
      SWAP_MEAL_ITEMS: '4',
      SUPPORT: '5',
      SUBSCRIPTION: '6'
    }

    const protectedSelection = ['2', '3', '4', '6']

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
          this.handleNoState({
            phoneNumber,
            profileName,
            customHeader:
              'You are already signed up, How else can be of service',
          });
          break;
        }
        this.handlePrivacy(phoneNumber);
        break;
      case ROUTE.CREATE_MEAL_PLAN:
        if (state.user?.activityLevel) {
          return this.sendTextAndSetCache({ message: 'You have already created a meal plan', phoneNumber, stage: 'landing' });
        }

        if (state.user?.subscriptionStatus !== 'active') return this.handlePaymentNotification({ phoneNumber, user: state.user as User })
        await this.sendTextAndSetCache({ message: `Hi, ${state.user?.name} I'd love to chat with you and ask a few questions to help create your personalized meal plan. 😊`, phoneNumber, stage: 'create-meal-plan/age' })
        await delay()
        await sendWhatsAppText({ message: 'Please tell me your age', phoneNumber })
        break;

      case ROUTE.View_MEAL_PLAN:
        if (!state.user?.activityLevel) {
          return this.sendTextAndSetCache({ message: 'Please create a meal plan to proceed', phoneNumber, stage: 'landing' });
        }

        if (state.user?.subscriptionStatus !== 'active') {
          return this.handlePaymentNotification({ phoneNumber, user: state.user as User })
        }

        return this.generateAndSendMealPlan({ phoneNumber, requiredCalorie: state.user.requiredCalorie!, user: state.user })

      case ROUTE.SUPPORT:
        return this.sendTextAndSetCache({
          message: `I apologize for any inconvenience you may have experienced. To log a complaint, please contact our support team at support@healthpaddy.com or call our helpline +xxxx . They will be able to assist you further and address your concerns.`, phoneNumber, stage: 'landing'
        })

      case ROUTE.SUBSCRIPTION:
        if (state.user?.subscriptionStatus === 'active') {
          return this.sendTextAndSetCache({
            message: `Manage your subscription\n
1. View Subscription
2. Cancel Subscription `, phoneNumber, stage: 'subscription-management'
          })
        }
        this.handleNoState({ phoneNumber, profileName, customHeader: `😔😔 I'm sorry, but you don't currently have an active subscription. To enjoy all the benefits, please consider subscribing. How else can I be of service?` })
        break;
      default:
        return this.handleNoState({ phoneNumber, profileName, customHeader: 'I could not understand your your request, lets start again' })
    }

    return {
      status: 'success',
    };
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
      sendWhatsAppText({
        phoneNumber, message: `${heading}\n
1. Signup
2. Create Meal Plan
3. View My Meal Plan
4. Swap Meal Items
5. Log a Complaint
6. Manage Subscription`});
    } catch (error) {
      console.log({ error });
    }
    const key = phoneNumber;
    this.cacheManager.set(key, JSON.stringify({ stage: 'landing', data: {} }));
    return {
      status: 'success',
    };
  };

  handlePrivacy = async (phoneNumber: string) => {
    const message = `Privacy Notice
                
We may collect the following personal data:
- Name
- Age
- Gender
- Height
- Weight
- Activity level
- Dietary preferences

How We Use Your Information
- Calculate your estimated daily calorie requirements
- Provide personalized nutrition and fitness recommendations
- Improve our services
- Respond to your inquiries

Data Security
We prioritize the security of your personal data. We implement measures to protect your data from unauthorized access, disclosure, alteration, and destruction.

Consent
By using our chat bot, you consent to the collection and use of your personal data as described in this privacy notice.

1. Accept
2. Reject`
    return this.sendTextAndSetCache({ message, phoneNumber, stage: 'privacy' })
  };

  handlePrivacyResponse = async ({
    phoneNumber,
    input,
    profileName,
  }: {
    phoneNumber: string;
    input: string;
    profileName: string;
  }) => {
    const message = `Great! 🚀 Thanks for saying 'yes' to our privacy notice. Your data is in good hands! Please follow the prompt below to get signup`;
    if (input === '1') {
      await sendWhatsAppText({ message, phoneNumber })
      await delay()
      sendWhatsAppText({ message: 'What is your name?', phoneNumber })

      await this.cacheManager.set(
        phoneNumber,
        JSON.stringify({ stage: 'signup/name', data: {} }));
    } else {
      return this.handleNoState({ phoneNumber, profileName });
    }
    return {
      status: 'success',
    };
  };

  handlePaymentNotification = async ({
    phoneNumber, user
  }: {
    phoneNumber: string; user: User
  }) => {
    const subscription = await this.repo.fetchSubscription(user.id! as unknown as string)
    const text = subscription?.subscriptionStatus === undefined ? `We provide a complimentary one-day meal plan after which you can subscribe to gain full access to our services. To get your free one-day meal plan, we'd appreciate it if you could add your payment card.` : 'Your subscription has expired 😔. To continue using our service and access all its benefits, please consider renewing your subscription.'
    const message = `Subscription alert\n
${text}

1. Accept
2. Decline`;

    return this.sendTextAndSetCache({ message, phoneNumber, stage: 'subscription-acceptance' })
  };

  handleUnknownRequest = async ({ phoneNumber, message }: { phoneNumber: string; message: string }) => {
    sendWhatsAppText({ phoneNumber, message });
    return {
      status: 'success',
    };
  };

  sendTextAndSetCache = async ({ message, phoneNumber, stage, data = {} }: { message: string, phoneNumber: string, stage: string, data?: any }) => {
    await this.cacheManager.set(phoneNumber, JSON.stringify({ stage, data }));
    sendWhatsAppText({ message, phoneNumber });
    return {
      status: 'success',
    };
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
    requiredCalorie,
    user,
    phoneNumber,
  }: {
    requiredCalorie: number;
    user: User;
    phoneNumber: string;
  }) {
    const closestCalorie = await this.getClosestMealPlan(requiredCalorie);
    const subscription = await this.repo.fetchSubscription(user.id as unknown as string);
    const subscriptionEndDate = DateTime.fromISO(subscription!.endDate!.toISOString().split('T')[0]!);
    const currentDate = DateTime.fromISO(new Date().toISOString().split('T')[0]!);
    const remainingSubscriptionsDays = user.hasUsedFreeTrial
      ? subscriptionEndDate.diff(currentDate, 'days').toObject().days
      : this.secrets.get('FREE_PLAN_DAYS');
    const numberOfMealPlanToFetch = remainingSubscriptionsDays! > 7 ? 7 : remainingSubscriptionsDays;
    const cacheKey = `${phoneNumber}-meal-plan`;

    const sendPlanMessage = async (plan: MealPlan) => {
      let message = `*${plan.day}*\n\n`;
      message += `*Breakfast*: ${plan.breakfast}\n\n`;
      message += `*Snack*: ${plan.snack}\n\n`;
      message += `*Lunch*: ${plan.lunch}\n\n`;
      message += `*Dinner*: ${plan.dinner}\n\n`;
      message += `\nTotal Calories: ${plan.breakfastCalories + plan.snackCalories + plan.lunchCalories + plan.dinnerCalories}`;
      this.sendTextAndSetCache({ message, phoneNumber, stage: 'view-plan' });
      await delay(300);
    };

    const mealPlan = await this.cacheManager.get<MealPlan[]>(cacheKey);

    if (mealPlan) {
      for await (const plan of mealPlan) {
        await sendPlanMessage(plan);
      }
      if (!user.hasUsedFreeTrial) {
        return this.repo.updateUser({ payload: { hasUsedFreeTrial: true }, userId: user!.id as unknown as string });
      }
    } else {
      if (remainingSubscriptionsDays! < 0) {
        return this.handleNoState({
          phoneNumber,
          profileName: user.name,
          customHeader: `You don't have any active subscription, please subscribe to continue enjoying our service`,
        });
      }

      const fetchedMealPlan = (
        await this.repo.fetchMealPlanByCalorieNeedId({
          calorieNeedId: closestCalorie!.id,
          limit: numberOfMealPlanToFetch!,
        })
      ).rows;

      const SEVEN_DAYS_IN_SECONDS = 604800;
      await this.cacheManager.set(cacheKey, fetchedMealPlan, SEVEN_DAYS_IN_SECONDS);

      for await (const plan of fetchedMealPlan) {
        await sendPlanMessage(plan);
      }

      if (!user.hasUsedFreeTrial) {
        return this.repo.updateUser({ payload: { hasUsedFreeTrial: true }, userId: user!.id as unknown as string });
      }
    }
  }


}
