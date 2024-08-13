import { Injectable } from "@nestjs/common";

import { sendWhatsAppText } from "../../helpers";
import {MealPlanRepo} from "../../repo";
import { FoodData, State } from "../../types";
import { GenericService } from "../general";

@Injectable()
export class FoodBankService {
  constructor(
    private mealPlanRepo: MealPlanRepo,
    private helper: GenericService,
  ) { }


  hasOneVariant = (data: FoodData[]) => {
    const uniqueValues = new Set(data.map(foodItem => foodItem.foodVariantName));
    return uniqueValues.size === 1;
  }

  handleFoodBank = async ({
    phoneNumber,
    state,
    input,
  }: {
    phoneNumber: string;
    state: State;
    input: string;
  }) => {
    try {
      const { stage } = state;
      const searchResult = await this.mealPlanRepo.searchFoodBank(input)
      if (stage === "food-bank") {
        if (!searchResult.length) return this.helper.sendTextAndSetCache({
          message: `Sorry, I could not find ${input}, please try another food. Kindly note that we are constantly
updating our database with your suggestions, and we look forward to including your search soon!`,
          phoneNumber,
          nextStage: "food-bank",
          state
        })
        if (searchResult.length > 1) {
          if (this.hasOneVariant(searchResult)) {
            return this.helper.sendTextAndSetCache({
              message: `${searchResult.map(item =>
                `* ${item.foodItemName} (${item.size}): ${item.calorie}\n`).join("")}`,
              phoneNumber,
              nextStage: "food-bank",
              state,
              data: { ...state.data },
            })
          }
          const variants = [
            ... new Set(searchResult.map((variant) => `${variant.foodItemName} ${variant.foodVariantName ? "-": ""}${variant.foodVariantName}`))
          ]
          if(searchResult[0]?.hasParts) {
            const cleanedVariantNames = [...new Set(searchResult.map(item => {
              let name = item.foodVariantName;
              if (!name) return
              name = name.replace(/\s*\(.*?\)/, "");
              name = name.replace(/\s*with skin|\s*skinless/, "");
              return name.trim();
            }))];

            return this.helper.sendTextAndSetCache({
              message: `Please specify which meal item by selecting an option\n
${cleanedVariantNames.map((method, index) => `${index + 1}. ${method}\n`).join("")}`,
              phoneNumber,
              nextStage: "food-bank/parts",
              state,
              data: {...state.data, foodVariant: searchResult, foodParts: cleanedVariantNames},
            });
          }

          return this.helper.sendTextAndSetCache({
            message: `Please specify which meal item by selecting an option\n
${variants.map((v, index) => `${index + 1}. ${v}\n`).join("")}`,
            phoneNumber,
            nextStage: "food-bank/variant",
            state,
            data: { ...state.data, foodVariant: variants, searchResult  },
          });
        } else {
          const result = searchResult[0];
          return this.helper.sendTextAndSetCache({
            message: `The amount of calorie in ${result?.foodItemName} per ${result?.size} is ${result?.calorie}`,
            phoneNumber,
            nextStage: "food-bank",
            state,
            data: { ...state.data },
          });
        }
      }
      if (stage === "food-bank/variant") {
        const parsedInput = Number(input);
        if (isNaN(parsedInput)) {
          await sendWhatsAppText({
            message: "Invalid input, please enter any option from the listed options above",
            phoneNumber,
          });
        }

        const { searchResult, foodVariant } = state.data;
        const selectedVariant = foodVariant[Number(input) -1];
        const [foodItem, variantName] = selectedVariant.split("-")

          const  foodList= searchResult.filter((item: { foodItemName: string | any[]; foodVariantName: string | any[]; }) => {
            const matchesFoodItem = foodItem ? item.foodItemName.includes(foodItem.trim()) : true;
            const matchesVariantName = variantName ? item.foodVariantName && item.foodVariantName.includes(variantName) : true;
            return matchesFoodItem && matchesVariantName;
          });

        return this.helper.sendTextAndSetCache({
          message: `${foodList.map((item: { foodItemName: string; foodVariantName: string; size: string; calorie: string; }) => `The amount of calorie in ${item.foodItemName} ${item.foodVariantName} per ${item.size} is ${item.calorie}\n`).join("")}`,
          phoneNumber,
          nextStage: "food-bank",
          state,
          data: { ...state.data },
        });
      }
      if (stage === "food-bank/parts") {
        await this.parseInput(input, phoneNumber);
        const foodVariant = state.data.foodVariant
        const selectedFoodPart = state.data.foodParts[Number(input) - 1];
        const filteredFood = foodVariant.filter((food: { foodVariantName: string | any[]; }) => food.foodVariantName.includes(selectedFoodPart) )

        const cookingMethods = [... new Set(filteredFood.map((item: { foodVariantName: string; }) => {
          const match = item.foodVariantName.match(/\((.*?)\)/);
          return match ? match[1] : null;
        }).filter(Boolean))]; // Filter out null values

        if(filteredFood.length > 1)  return this.helper.sendTextAndSetCache({
          message: `Please specify your preferred cooking method\n
${cookingMethods.map((method: any, index: number) => `${index + 1}. ${method}\n`).join("")}`,
          phoneNumber,
          nextStage: "food-bank/cooking-methods",
          state,
          data: { ...state.data, foodVariant: searchResult, filteredFood, cookingMethods },
        });

      }
      if (stage === "food-bank/cooking-methods") {
        await this.parseInput(input, phoneNumber);
        const cookingMethod = state.data.cookingMethods[Number(input) - 1];
        const filteredFoods = state.data.filteredFood;
        const filterFood = filteredFoods.find((food: { foodVariantName: string | any[]; }) => food.foodVariantName.includes(cookingMethod))


        const { calorie, size, foodVariantName, foodItemName } = filterFood as FoodData
        return this.helper.sendTextAndSetCache({
          message: `The amount of calorie in ${foodItemName} ${foodVariantName} per ${size} is ${calorie}`,
          phoneNumber,
          nextStage: "food-bank",
          state,
          data: { ...state.data },
        });
      }

    } catch (error) {
      console.log({ error });
    }
    return {
      status: "success",
    };
  };

  private async parseInput(input: string, phoneNumber: string) {
    const parsedInput = Number(input);
    if (isNaN(parsedInput)) {
      await sendWhatsAppText({
        message: "Invalid input, please enter any option from the listed options above",
        phoneNumber,
      });
    }
  }
}

