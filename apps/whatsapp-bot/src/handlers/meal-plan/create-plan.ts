/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';

import { AppRepo } from '../../app/app.repo';
import { calculateRequireCalorie, sendWhatsAppText, validFeetAndInches } from '../../helpers';
import { State } from '../../types';
import { GenericService } from '../general';
import { ViewMealPlanService } from './view-plan';

@Injectable()
export class CreateMealPlanService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private viewMealPlan: ViewMealPlanService,
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
      const { stage } = state;

      if (stage === 'create-meal-plan/age') {
        const message = `Thanks! could you share your gender with me?\n
1. Male
2. Female`
        const parsedAge = Number(input)
        if (Number.isNaN(parsedAge)) {
          sendWhatsAppText({ message: `Please enter a valid age`, phoneNumber })
          return {
            status: 'success'
          }
        }
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'create-meal-plan/gender', data: { age: input }
        })
      }
      if (stage === 'create-meal-plan/gender') {
        const gender = input == 1 ? 'male' : input == 2 ? 'female' : '';
        if (!gender) {
          sendWhatsAppText({ message: `Please choose between male and female`, phoneNumber })
          return {
            status: 'success'
          }
        }
        const message = `Perfect!, May I ask for your height in feet, for example, in the format "5f11" or 5'11?`
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'create-meal-plan/height', data: { ...state.data, gender }
        })
      }
      if (stage === 'create-meal-plan/height') {
        const validatedFeetAndInches = validFeetAndInches(input as string)
        if (!validatedFeetAndInches) {
          sendWhatsAppText({ message: `Please enter a valid height in feet, for example, in the format "5f11" or 5'11?`, phoneNumber })
          return {
            status: 'success'
          }
        }
        const message = `Excellent! Would you be willing to tell me your weight in kilograms?`
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'create-meal-plan/weight', data: { ...state.data, height: input }
        })
      }
      if (stage === 'create-meal-plan/weight') {
        const parsedWeight = Number(input)
        if (isNaN(parsedWeight)) {
          sendWhatsAppText({ message: `Please enter a valid weight in kilograms`, phoneNumber })
          return {
            status: 'success'
          }
        }
        const message = `We are almost there, Please, Select your most appropriate activity level?\n
1. Sedentary (little to no regular exercise).

2. Mild activity (intense exercise for at least 20 minutes 1-3 times per week. This may include things like brisk walking, bicycling, jogging, basketball, swimming etc. If you do not exercise regularly, but you maintain a busy life that requires you to walk frequently for long periods, you meet the requirements for this level).

3. Moderate activity (intense exercise for 60 min 3 to 4 times per week. Any of the activities listed above will qualify)

4. Heavy or labour-intensive activity (intense exercise for 60min or greater, 5 to 7 days per week. Labour intensive occupations also qualify for this level, such as bricklaying, carpentry, general labour, farming etc.).

5. Extreme activity (Exceedingly active and/ or very demanding activities, such as athlete with an almost unstoppable training schedule, very demanding jobs such as shovelling coal or working long hours on an assembly line).`
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'create-meal-plan/activity-level', data: { ...state.data, weight: input }
        })
      }

      if (stage === 'create-meal-plan/activity-level') {
        const activityLevel = input == 1 ? 'sedentary' : input == 2 ? 'mild' : input == 3 ? 'moderate' : input == 4 ? 'heavy' : input == 5 ? 'extreme' : ''
        if (!activityLevel) {
          sendWhatsAppText({ message: `Please select an activity level`, phoneNumber });
          return {
            status: 'success'
          }
        }
        const message = `Finally, are you managing any of these health conditions?\n
1. None 
2. Hypertension
3. Diabetes
4. Pre-diabetes
5. High Cholesterol`
        return this.helper.sendTextAndSetCache({
          message, phoneNumber, stage: 'create-meal-plan/health-condition', data: { ...state.data, activityLevel }
        })
      }

      if (stage === 'create-meal-plan/health-condition') {
        const message = `Sit back while i calculate your required daily calorie and create your customized meal plan`
        const healthCondition = input == 1 ? 'none' : input == 2 ? 'hypertension' : input == 3 ? 'diabetes' : input == 4 ? 'diabetes' : input == 5 ? 'highCholesterol' : ''
        if (healthCondition === 'none') {
          const { data: { age, activityLevel, gender, height, weight, healthCondition } } = state
          const value = validFeetAndInches(height)
          const requiredCalorie = calculateRequireCalorie({ age, inches: value!.inches, feet: value!.feet, weight, gender, activityLevel })
          this.repo.updateUser({ payload: { age, activityLevel, sex: gender, height, weight, healthCondition, requiredCalorie }, userId: state.user!.id as unknown as string })
          await sendWhatsAppText({ message, phoneNumber })
          await this.helper.sendTextAndSetCache({
            message: `Thank you ${state.user?.name}, to maintain your current weight, you will be needing ${requiredCalorie} Cal per day`, phoneNumber, stage: 'create-meal-plan/view', data: { ...state.data, healthCondition }
          })
          return this.viewMealPlan.handleViewMealPlan({ phoneNumber, requiredCalorie, user: state.user! })

        }
        return this.helper.sendTextAndSetCache({
          message: `Please contact support`, phoneNumber, stage: 'create-meal-plan/view', data: { ...state.data, healthCondition }
        })
      }

    } catch (err) {
      console.log(err);

    }
  }
}

