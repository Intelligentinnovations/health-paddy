/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from "@nestjs/common";

import {MealPlanRepo} from "../../repo";
import { MealPlan, State } from "../../types";
import { GenericService } from "../general";

@Injectable()
export class ViewRecipeService {
  constructor(
    private mealPlanRepo: MealPlanRepo,
    private helper: GenericService,
  ) { }

  handleViewRecipe = async ({
    phoneNumber,
    state,
    input,
  }: {
    phoneNumber: string;
    state: State;
    input: string;
  }) => {

    try {
      const baseUrl = "view-recipe";
      if (state.stage === `${baseUrl}/day`) {
        const days = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
        const selectedDay = days[Number(input) - 1];
        const userMealPlan = await this.helper.getMealPlan({state, numberOfMealPlans: 8})

        if (userMealPlan && userMealPlan.length) {
          const selectedMealDay = userMealPlan.find(
            (meal) => meal.day === selectedDay
          ) as MealPlan;

          const foodWithRecipes: string[] = [];
          for (const key in selectedMealDay) {
            const value = selectedMealDay[key as keyof MealPlan]! as string;


            if (value.toString().toLowerCase().includes("recipe")) {
              foodWithRecipes.push(
                selectedMealDay[key as keyof MealPlan] as string
              );
            }
          }
          const extractedPortions = [];
          const regex = /^(.+?)\s*\(see recipe\)/i;

          for (const foodString of foodWithRecipes) {
            const parts = foodString.split("+").map((part) => part.trim());
            const match = parts.find((part) => regex.test(part));
            if (match) {
              const regexResult = match.match(regex);
              const extractedPortion = regexResult ? regexResult[1] : null;
              extractedPortions.push(extractedPortion);
            }
          }
          if (!extractedPortions.length) {
            return this.helper.sendTextAndSetCache({
              message: "You have no meal with recipe for this day",
              phoneNumber,
              nextStage: "",
              state
            })
          }
          return this.helper.sendTextAndSetCache({
            message: `Please select a meal\n\n${extractedPortions
              .map((portion, index) => `${index + 1}. ${portion}`)
              .join("\n")}`,
            phoneNumber,
            state,
            nextStage: `${baseUrl}/day/meal`,
            data: { mealsWithRecipe: extractedPortions },
          });
        }
      }
      if (state.stage === `${baseUrl}/day/meal`) {
        const { mealsWithRecipe } = state.data;
        const selectedMeal = mealsWithRecipe[Number(input) - 1];
        const parsedMeal = selectedMeal.split(" of ")[1].trim();
        const closestCalorie = await this.helper.getClosestMealPlan(
          state!.user!.requiredCalorie as number
        );
        const recipe = await this.mealPlanRepo.getRecipe({
          calorie: closestCalorie!.calories,
          mealName: parsedMeal.trim(),
        });

        if (recipe) {
          const message = `*${recipe?.name} (${recipe?.servings} Servings)*\n
*Instructions*:${recipe?.instructions.map(instruction => `\n\n* ${instruction}`).join("")}\n
*Ingredients*:${recipe?.ingredients.map(ingredient => `\n\n* ${ingredient}`).join("")}`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            state,
            nextStage: "landing",
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  };
}
