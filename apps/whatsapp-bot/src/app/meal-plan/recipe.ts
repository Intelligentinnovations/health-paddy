/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MESSAGE_MANAGER, Messaging } from '@backend-template/messaging';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { SecretsService } from '../../secrets/secrets.service';
import { MealPlan, State } from '../../types';
import { AppRepo } from '../app.repo';
import { GenericService } from '../general';


@Injectable()
export class ViewRecipeService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private secrets: SecretsService,
    @Inject(MESSAGE_MANAGER) private messaging: Messaging,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  handleViewRecipe = async ({
    phoneNumber,
    state,
    input

  }: {
    phoneNumber: string;
    state: State,
    input: string
  }) => {
    try {
      const baseUrl = `view-recipe`
      if (state.stage === `${baseUrl}/day`) {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        const selectedDay = days[Number(input) - 1]

        const cacheKey = `${phoneNumber}-meal-plan`;

        const userMealPlan = await this.cacheManager.get<MealPlan[]>(cacheKey)
        if (userMealPlan && userMealPlan.length) {
          const selectedMealDay = userMealPlan.find(meal => meal.day === selectedDay) as MealPlan
          const foodWithRecipes: string[] = []
          for (const key in selectedMealDay) {
            const value = selectedMealDay[key as keyof MealPlan]! as string

            if (typeof value === 'string' && value.toLowerCase().includes('recipe')) {
              foodWithRecipes.push(selectedMealDay[key as keyof MealPlan] as string);
            }
          }
          const extractedPortions = [];
          const regex = /^(.+?)\s*\(see recipe\)/i;

          for (const foodString of foodWithRecipes) {
            const parts = foodString.split('+').map(part => part.trim());
            const match = parts.find(part => regex.test(part));
            if (match) {
              const regexResult = match.match(regex);
              const extractedPortion = regexResult ? regexResult[1] : null;
              extractedPortions.push(extractedPortion);
            }
          }
          
          return this.helper.sendTextAndSetCache({
            message: `Please select a meal\n${extractedPortions.map((portion, index) => `${index + 1}. ${portion}`).join('\n')}`,
            phoneNumber,
            state,
            nextStage: `${baseUrl}/day/meal`,
            data: { mealsWithRecipe: extractedPortions }
          })
        }
      }
      if (state.stage === `${baseUrl}/day/meal`) {
        const { mealsWithRecipe } = state.data;
        const selectedMeal = mealsWithRecipe[Number(input) - 1]
        console.log({ selectedMeal });

      }
    } catch (err) {
      console.log(err);

    }
  }
}