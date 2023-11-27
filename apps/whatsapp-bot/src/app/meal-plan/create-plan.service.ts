/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';

import {
  calculateRequireCalorie,
  sendWhatsAppText,
  validFeetAndInches,
} from '../../helpers';
import { HealthGoal, State } from '../../types';
import { ParsedNumber } from '../../utils/schema/auth.schema';
import {
  activityLevelText,
  extremeGainWeightText,
  extremeWeightLossText,
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
  ) { }

  handleCreateMealPlan = async ({
    phoneNumber,
    state,
    input,
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
          stage: `${basePath}/gender`,
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
          stage: `${basePath}/height`,
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
          stage: 'create-meal-plan/weight',
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
1) Maintain weight
2) Loose weight
3  Weight gain`;
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          stage: `${basePath}/goal`,
          data: { ...state.data, weight: input },
        });
      }

      if (stage === `${basePath}/goal`) {
        if (input === HealthGoal['maintain weight']) {
          return this.helper.sendTextAndSetCache({
            message: activityLevelText,
            phoneNumber,
            stage: `${basePath}/activity-level`,
            data: { ...state.data, goal: 'maintain weight' },
          });
        }
        if (
          input === HealthGoal['loose weight'] ||
          input === HealthGoal['gain weight']
        ) {
          const message = 'What is your target weight in Kilograms';
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message,
            stage: `${basePath}/target-weight`,
            data: {
              ...state.data,
              goal: Object.keys(HealthGoal).find(
                (key) => HealthGoal[key] === input
              ),
            },
          });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          stage: `${basePath}/goal`,
          message: 'Please select your desired health goal',
          data: state.data,
        });
      }

      if (stage === `${basePath}/target-weight`) {
        try {
          ParsedNumber.parse(input);
        } catch (e) {
          await sendWhatsAppText({
            message: `Please enter a valid target weight`,
            phoneNumber,
          });
        }
        if (state.data.goal === 'loose weight') {
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
          stage: `${basePath}/goal-duration`,
          data: { ...state.data, targetWeight: input },
        });
      }
      if (stage === `${basePath}/duration`) {
        try {
          ParsedNumber.parse(input);
        } catch (e) {
          await sendWhatsAppText({
            message: `Please enter a valid duration in months`,
            phoneNumber,
          });
        }
        const { targetWeight, weight: currentWeight } = state.data;
        if (state.data.goal === 'loose weight') {
          const weightToLoose = currentWeight - targetWeight;
          const weightLossPerMonth = weightToLoose / Number(input);
          if (weightLossPerMonth > 8)
            return sendWhatsAppText({
              phoneNumber,
              message: extremeWeightLossText
            });
        } else {
          const weightToGain = targetWeight - currentWeight;
          const weightGainPerMonth = weightToGain / Number(input);
          if (weightGainPerMonth > 2.5)
            return sendWhatsAppText({
              phoneNumber,
              message: extremeGainWeightText,
            });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          message: activityLevelText,
          stage: `${basePath}/activity-level`,
          data: { ...state.data, durationInMonth: input },
        });
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
          stage: `${basePath}/health-condition`,
          data: { ...state.data, activityLevel },
        });
      }
      if (stage === `${basePath}/health-condition`) {
        const firstMessage = `Sit back while I calculate your required daily calorie and create your customized meal plan`;
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
              healthCondition,
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
            userId: state.user!.id as unknown as string,
          });
          const weightDifference = Math.abs(weight - targetWeight);
          await sendWhatsAppText({ message: firstMessage, phoneNumber });
          await this.helper.sendTextAndSetCache({
            message: getCalorieGoalText({ goal, requiredCalorie, userName: state.user!.name, durationInMonth, weightDifference }),
            phoneNumber,
            stage: `${basePath}/view`,
            data: { ...state.data, healthCondition },
          });
          return this.viewMealPlan.handleViewMealPlan({
            phoneNumber,
            requiredCalorie,
            user: state.user!,
          });
        }
        return this.helper.sendTextAndSetCache({
          message: `Please contact support`,
          phoneNumber,
          stage: '',
          data: { ...state.data, healthCondition },
        });
      }
    } catch (err) {
      console.log(err);
    }
  };
}
