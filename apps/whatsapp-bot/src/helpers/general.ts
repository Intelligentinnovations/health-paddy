import { ActivityLevel, CalorieCalculator } from "../types";

export function formatCurrency(amount: number, currencyCode = 'NGN') {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode
  });

  return currencyFormatter.format(amount);
}


function feetAndInchesToCm({ feet, inches }: { feet: number; inches: number }) {
  const feetToCm = feet * 30.48;
  const inchesToCm = inches * 2.54;
  const totalCm = feetToCm + inchesToCm;
  return totalCm;
}



export const calculateRequireCalorie = ({ age, weight, feet, inches, gender, activityLevel }: CalorieCalculator) => {
  const commonCalories = (10 * weight) + (6.25 * feetAndInchesToCm({ feet, inches })) - (5 * age);
  const activityLevelIndex = ActivityLevel[activityLevel]
  const calorieRequired = gender === 'male' ? commonCalories + 5 * activityLevelIndex : commonCalories - 161 * activityLevelIndex;
  return calorieRequired
}


export const capitalizeString = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}


export const validFeetAndInches = (input: string) => {
  const regex = /(\d+)\s*(?:f|'|(?:feet))?\s*(\d+)\s*(?:in|")?(?:ches)?/;
  const match = input?.match(regex);
  if (!match) {
    return null
  }
  const feet = parseInt(match[1] as string, 10) || 0;
  const inches = parseInt(match[2] as string, 10) || 0;

  return { feet, inches };
};


export function delay(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}