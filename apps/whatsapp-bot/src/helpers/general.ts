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
  return feetToCm + inchesToCm;
}


export const calculateRequireCalorie = ({ age, weight, feet, inches, gender, activityLevel, goal, targetWeight, durationInMonth }: CalorieCalculator) => {
  const commonCalories = (10 * weight) + (6.25 * feetAndInchesToCm({ feet, inches })) - (5 * age);
  const activityLevelIndex = ActivityLevel[activityLevel]
  const caloriesToMaintainWeight = gender === 'male' ? commonCalories + 5 * activityLevelIndex : commonCalories - 161 * activityLevelIndex

  if (goal === 'Loose Weight') {
    const amountOfWeightToLoose = weight - targetWeight;
    const durationInWeeks = durationInMonth * 4;
    const calorieNeed = caloriesToMaintainWeight - (amountOfWeightToLoose / durationInWeeks * 500)
    return Math.round(calorieNeed / 100) * 100;
  }
  else if (goal === 'Gain Weight') {
    const amountOfWeightToGain = targetWeight - weight;
    const durationInWeeks = durationInMonth * 4;
    const calorieNeed = caloriesToMaintainWeight + (amountOfWeightToGain / durationInWeeks * 500)
    return Math.round(calorieNeed / 100) * 100;
  }
  else {
    return caloriesToMaintainWeight
  }
}


export const capitalizeString = (text: string) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

export const validFeetAndInches = (input: string) => {
  const regex = /^(\d+)[f']([0-9]|1[0-1])$/;
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


export function generateDaysOfWeek(): string[] {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayIndex = new Date().getDay();

  const next7Days = Array.from({ length: 7 }, (_, index) => {
    const nextDayIndex = (currentDayIndex + index) % 7;
    return daysOfWeek[nextDayIndex];
  });

  return next7Days as string[];
}