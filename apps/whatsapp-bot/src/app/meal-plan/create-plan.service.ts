/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';

import { calculateRequireCalorie, delay, sendWhatsAppText, validFeetAndInches, } from '../../helpers';
import { HealthGoal, State } from '../../types';
import {
  extremeGainWeightText,
  extremeWeightLossText,
  getActivityLevelText,
  getCalorieGoalText,
  healthConditionText,
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
    private viewMealPlan: ViewMealPlanService
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
          data: { age: input },
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
        const message = `Excellent! Would you be willing to tell me your weight in kilograms?`;
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: 'create-meal-plan/weight',
          state,
          data: { ...state.data, height: input },
        });
      }
      if (stage === `${basePath}/weight`) {
        const parsedWeight = Number(input);
        if (isNaN(parsedWeight)) {
          await sendWhatsAppText({
            message: `Please enter a valid weight in kilograms`,
            phoneNumber,
          });
          return {
            status: 'success',
          };
        }
        const message = `What health goal do you want to achieve ?\n
1) Maintain Weight
2) Loose Weight
3) Gain Weight`;
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/goal`,
          state,
          data: { ...state.data, weight: input },
        });
      }

      if (stage === `${basePath}/goal`) {
        if (input === HealthGoal['Maintain Weight']) {
          return this.helper.sendTextAndSetCache({
            message: getActivityLevelText("Maintain Weight"),
            phoneNumber,
            state,
            nextStage: `${basePath}/activity-level`,
            data: { ...state.data, goal: 'maintain weight' },
          });
        }
        if (
          input == HealthGoal['Loose Weight'] ||
          input == HealthGoal['Gain Weight']
        ) {
          const initialMessage = input == HealthGoal['Loose Weight'] ? `You've made an empowering choice by selecting the Lose Weight option! 🌱🔥 Our meal plans are here to support you on your weight loss journey, guiding you towards a healthier, more vibrant you ` : `Enjoy delicious and nourishing meals that promote muscle 
          growth and help you gain healthy weight. Together, we'll lay a solid foundation for your progress!💫`
          await sendWhatsAppText({
            message: initialMessage, phoneNumber
          })
          await delay()
          const message = 'What is your target weight in Kilograms';
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
            message: `Please enter a valid weight in kilograms`,
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
          message: weightLossDurationText,
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
        if (state.data.goal === 'Loose Weight') {
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
          message: getActivityLevelText(state.data.goal),
          nextStage: `${basePath}/activity-level`,
          state,
          data: { ...state.data, durationInMonth: Number(input) },
        });
      }

      if (stage === `${basePath}/extreme/weight-loss/gain`) {
        if (input == 1) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: `Please re - enter a duration in months`,
            nextStage: `${basePath}/goal-duration`,
            state,
            data: state.data
          });
        }

        if (input == 2) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: `Please re - enter your target weight`,
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
                ? 'diabetes'
                : input == 4
                  ? 'diabetes'
                  : input == 5
                    ? 'highCholesterol'
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
            message: `Your calorie requirement  of ${requiredCalorie} is too low.The recommended minimum is 1200cal per day to meet your body's nutritional needs`,
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
              healthCondition: 'none',
              requiredCalorie,
            },
            userId: state.user!.id,
          });
          const weightDifference = Math.abs(weight - targetWeight);
          await this.helper.sendTextAndSetCache({
            message: getCalorieGoalText({
              goal,
              requiredCalorie,
              userName: state.user!.name,
              durationInMonth,
              weightDifference
            }),
            phoneNumber,
            nextStage: `${basePath}/view`,
            state,
            data: { ...state.data, healthCondition },
          });
          await this.viewMealPlan.handleViewMealPlan({
            phoneNumber,
            state,
          });
          return this.helper.handleNoState({
            phoneNumber,
            profileName: state.user!.name,
            customHeader: `Congratulations on creating your personalized meal plan with Health Paddy! You have taken the first step to a healthier and happier you 🌱🥗
Is there anything else I may assist you with ?`
          })
        }
        return this.helper.sendTextAndSetCache({
          message: `Please contact support`,
          phoneNumber,
          nextStage: 'landing',
          state,
          data: { ...state.data, healthCondition },
        });
      }
    } catch (err) {
      console.log(err);
    }
  };
}
