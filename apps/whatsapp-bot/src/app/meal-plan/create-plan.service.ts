/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';

import { calculateRequireCalorie, delay, formatCurrency, sendWhatsAppText, validFeetAndInches } from '../../helpers';
import { SecretsService } from '../../secrets/secrets.service';
import { PaymentService } from '../../services/paystack';
import { HealthGoal, State } from '../../types';
import {
  extremeGainWeightText,
  extremeWeightLossText,
  getActivityLevelText,
  getCalorieGoalText,
  healthConditionText,
  weightGainDurationText,
  weightLossDurationText
} from '../../utils/textMessages';
import { AppRepo } from '../app.repo';
import { GenericService } from '../general';
import { ViewMealPlanService } from './view-plan';

@Injectable()
export class CreateMealPlanService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private viewMealPlan: ViewMealPlanService,
    private paymentService: PaymentService,
    private secrets: SecretsService,
  ) {
  }

  handleCreateMealPlan = async ({
    phoneNumber,
    state,
    input
  }: {
    phoneNumber: string;
    state: State;
    input: number | string;
  }) => {
    try {
      const basePath = 'create-meal-plan';
      const { stage } = state;

      if (stage === `${basePath}/age`) {
        const message = `Thanks! could you share your gender with me?\n
1. Male
2. Female`;
        const parsedAge = Number(input);
        if (Number.isNaN(parsedAge)) {
          await sendWhatsAppText({
            message: `Please enter a valid age`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/gender`,
          state,
          data: { ...state.data, age: input },
        });
      }
      if (stage === `${basePath}/gender`) {
        const gender = input == 1 ? 'male' : input == 2 ? 'female' : '';
        if (!gender) {
          await sendWhatsAppText({
            message: `Please choose between 1 and 2`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        const message = `Perfect!, May I ask for your height in feet, for example, in the format "5f11" or 5'11?`;
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/height`,
          state,
          data: { ...state.data, gender },
        });
      }
      if (stage === `${basePath}/height`) {
        const validatedFeetAndInches = validFeetAndInches(input as string);
        if (!validatedFeetAndInches) {
          await sendWhatsAppText({
            message: `Please enter a valid height in feet, for example, in the format "5f11" or 5'11?`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        const message = `Excellent! Would you be willing to tell me your weight in KG? (e.g 70)`;
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/weight`,
          state,
          data: { ...state.data, height: input },
        });
      }
      if (stage === `${basePath}/weight`) {
        const parsedWeight = Number(input);
        if (isNaN(parsedWeight)) {
          await sendWhatsAppText({
            message: `Please enter a valid weight in KG (e.g 70)`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        const selectedGoal = state.data.goal;
        if (selectedGoal) {
          if (selectedGoal == 'Maintain Weight') {
            return this.helper.sendTextAndSetCache({
              message: getActivityLevelText(),
              phoneNumber,
              state,
              nextStage: `${basePath}/activity-level`,
              data: { ...state.data, weight: input },
            });
          }
          if (selectedGoal == 'Loose Weight' || selectedGoal == 'Gain Weight') {
            const initialMessage = selectedGoal == 'Loose Weight'
              ? `You've made an empowering choice by selecting the Lose Weight option! 🌱🔥 Our meal plans are here to support you on your weight loss journey, guiding you towards a healthier, more vibrant you `
              : `Enjoy delicious and nourishing meals that promote muscle growth and help you gain healthy weight. Together, we'll lay a solid foundation for your progress!💫`
            await sendWhatsAppText({
              message: initialMessage, phoneNumber
            })
            await delay()
            const message = 'What is your target weight in KG? (e.g 50)';
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message,
              nextStage: `${basePath}/target-weight`,
              state,
              data: {
                ...state.data,
                weight: input
              },
            });
          }
        }
        else {
          const message = `What health goal do you want to achieve ?\n
1. Maintain Weight
2. Loose Weight
3. Gain Weight`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: `${basePath}/goal`,
            state,
            data: { ...state.data, weight: input },
          });
        }
      }

      if (stage === `${basePath}/goal`) {
        if (input == HealthGoal['Maintain Weight']) {
          return this.helper.sendTextAndSetCache({
            message: getActivityLevelText(),
            phoneNumber,
            state,
            nextStage: `${basePath}/activity-level`,
            data: { ...state.data, goal: 'Maintain Weight' },
          });
        }
        if (
          input == HealthGoal['Loose Weight'] ||
          input == HealthGoal['Gain Weight']
        ) {
          const initialMessage = input == HealthGoal['Loose Weight']
            ? `You've made an empowering choice by selecting the Lose Weight option! 🌱🔥 Our meal plans are here to support you on your weight loss journey, guiding you towards a healthier, more vibrant you `
            : `Enjoy delicious and nourishing meals that promote muscle growth and help you gain healthy weight. Together, we'll lay a solid foundation for your progress!💫`
          await sendWhatsAppText({
            message: initialMessage, phoneNumber
          })
          await delay()
          const message = 'What is your target weight in KG (e.g 50)';
          const goal = Object.keys(HealthGoal).find(
            (key) => HealthGoal[key] == input
          );

          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message,
            nextStage: `${basePath}/target-weight`,
            state,
            data: {
              ...state.data,
              goal
            },
          });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          nextStage: `${basePath}/goal`,
          state,
          message: 'Please select your desired health goal',
          data: state.data,
        });
      }

      if (stage === `${basePath}/target-weight`) {
        const parseTargetWeight = Number(input);
        if (isNaN(parseTargetWeight)) {
          await sendWhatsAppText({
            message: `Please enter a valid weight in KG (e.g 70)`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        if (state.data.goal === 'Loose Weight') {
          if (input >= state.data.weight) {
            return sendWhatsAppText({
              phoneNumber,
              message:
                'Your target weight should be less than your current weight to lose weight',
            });
          }
        } else {
          if (input <= state.data.weight) {
            return sendWhatsAppText({
              phoneNumber,
              message:
                'Your target weight should be more than your current weight to gain weight',
            });
          }
        }

        return this.helper.sendTextAndSetCache({
          phoneNumber,
          message: state.data.goal === 'Gain Weight' ? weightGainDurationText : weightLossDurationText,
          nextStage: `${basePath}/goal-duration`,
          state,
          data: { ...state.data, targetWeight: Number(input) },
        });
      }
      if (stage === `${basePath}/goal-duration`) {
        const parsedDuration = Number(input);
        if (isNaN(parsedDuration)) {
          await sendWhatsAppText({
            message: `Please enter a valid duration in months`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        const { targetWeight, weight: currentWeight } = state.data;
        if (state.data.goal == 'Loose Weight') {
          const weightToLoose = currentWeight - targetWeight;
          const weightLossPerMonth = weightToLoose / Number(input);
          if (weightLossPerMonth > 8)
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message: extremeWeightLossText,
              nextStage: `${basePath}/extreme/weight-loss/gain`,
              state,
              data: state.data
            });
        } else {
          const weightToGain = targetWeight - currentWeight;
          const weightGainPerMonth = weightToGain / Number(input);
          if (weightGainPerMonth > 2.5)
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message: extremeGainWeightText,
              nextStage: `${basePath}/extreme/weight-loss/gain`,
              state,
              data: state.data
            });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          message: getActivityLevelText(),
          nextStage: `${basePath}/activity-level`,
          state,
          data: { ...state.data, durationInMonth: Number(input) },
        });
      }

      if (stage === `${basePath}/extreme/weight-loss/gain`) {
        if (input == 1) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: `Please re - enter a duration in months (e.g 2)`,
            nextStage: `${basePath}/goal-duration`,
            state,
            data: state.data
          });
        }

        if (input == 2) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: `Please re - enter your target weight in KG (e.g 70)`,
            nextStage: `${basePath}/target-weight`,
            state,
            data: state.data
          });
        }
      }

      if (stage === `${basePath}/activity-level`) {
        const activityLevel =
          input == 1
            ? 'sedentary'
            : input == 2
              ? 'mild'
              : input == 3
                ? 'moderate'
                : input == 4
                  ? 'heavy'
                  : input == 5
                    ? 'extreme'
                    : '';
        if (!activityLevel) {
          await sendWhatsAppText({
            message: `Please select an activity level`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        return this.helper.sendTextAndSetCache({
          message: healthConditionText,
          phoneNumber,
          nextStage: `${basePath}/health-condition`,
          state,
          data: { ...state.data, activityLevel },
        });
      }
      if (stage === `${basePath}/health-condition`) {
        const healthCondition =
          input == 1
            ? 'none'
            : input == 2
              ? 'hypertension'
              : input == 3
                ? 'diabetes/pre-diabetes'
                : input == 4
                  ? 'high cholesterol'
                  : input == 5
                    ? 'polycystic Ovary Syndrome (PCOS)'
                    : '';
        if (healthCondition === 'none') {
          const {
            data: {
              age,
              activityLevel,
              gender,
              height,
              weight,
              goal,
              targetWeight,
              durationInMonth,
            },
          } = state;
          const value = validFeetAndInches(height);
          const requiredCalorie = calculateRequireCalorie({
            age,
            inches: value!.inches,
            feet: value!.feet,
            weight,
            gender,
            activityLevel,
            goal,
            targetWeight,
            durationInMonth,
          });
          if (requiredCalorie < 1200) return this.helper.sendTextAndSetCache({
            message: `Your calorie requirement of ${requiredCalorie} is too low. The recommended minimum is 1200 cal per day to meet your body's nutritional needs`,
            phoneNumber,
            nextStage: 'landing',
            state
          })
          await this.repo.updateUser({
            payload: {
              age,
              activityLevel,
              sex: gender,
              height,
              weight,
              healthCondition,
              requiredCalorie,
            },
            userId: state.user!.id,
          });
          const weightDifference = Math.abs(weight - targetWeight);
          await this.helper.sendTextAndSetCache({
            message: getCalorieGoalText({
              goal,
              requiredCalorie,
              durationInMonth,
              weightDifference: Math.trunc(weightDifference)
            }),
            phoneNumber,
            nextStage: '',
            state,
            data: { ...state.data, healthCondition },
          });
          await this.helper.sendTextAndSetCache({
            message: `Would you like us to create a Nigerian meal plan that will provide you ${requiredCalorie} cal per day towards achieving your goal?\n
1. Absolutely
2. No, thank you, I'm good`,
            phoneNumber,
            state,
            nextStage: `${basePath}/should-generate-meal-plan`,
          })
        } else {
          const specialHealthPlan = await this.repo.fetchSpecialSubscriptionPlan();
          const paymentLink = await this.paymentService.initializePaystackPayment({
            email: state!.user!.email,
            amountInNaira: Number(specialHealthPlan!.amount),
            metaData: { phoneNumber, planPaidFor: specialHealthPlan },
          })

          const { data, status } = paymentLink;
          if (status) {
            const message = `We are here to support you on your health journey ensuring you stay and keep you healthy, We understand that some of our clients face health challenges, and we want to accommodate their needs.
            A form will be sent to you to collect more specific information Click on the pay now button below to pay ${formatCurrency(+specialHealthPlan!.amount)}.`;
            return this.helper.sendCallToActionAndSetCache({
              phoneNumber,
              message,
              nextStage: 'landing',
              state,
              callToActionText: 'Pay now',
              link: data.data.authorization_url,
              data: { ...state.data, healthCondition },
            });
          }
        }
      }

      const ACCEPT = 1;
      const DECLINE = 2;

      if (stage == `${basePath}/should-generate-meal-plan`) {
        if (input == ACCEPT) {
          await this.viewMealPlan.handleViewMealPlan({
            phoneNumber,
            state,
          });
        }

        if (input == DECLINE) {
          return this.helper.handleNoState({
            phoneNumber,
            profileName: state.user!.name,
            customHeader: `Thank you for using Health Paddy, we look forward to helping you on your health journey soon, How else can i be of service ?`,
            state,
          });
        }

      }
    } catch (err) {
      console.log(err);
    }
  };
}
