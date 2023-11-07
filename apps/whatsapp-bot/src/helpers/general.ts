import { ActivityLevel, CalorieCalculator } from "../types";

export function formatCurrency(amount: number, currencyCode = 'NGN') {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  });

  return currencyFormatter.format(amount);
}


const footToCm = (foot: number) => {
  return foot * 30.48
}

export const calculateRequireCalorie = ({ age, height, weight, gender, activityLevel }: CalorieCalculator) => {
  const commonCalories = (10 * weight) + (6.25 * footToCm(height)) - (5 * age);
  const activityLevelIndex = ActivityLevel[activityLevel]
  const calorieRequired = gender === 'male' ? commonCalories + 5 * activityLevelIndex : commonCalories - 161 * activityLevelIndex;
  return calorieRequired
}


export const capitalizeString = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}