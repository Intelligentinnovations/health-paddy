import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const SubscriptionStatus = {
  active: 'active',
  expired: 'expired',
  canceled: 'canceled',
} as const;
export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const FoodCategory = {
  Starch: 'Starch',
  Fruits: 'Fruits',
  Protein: 'Protein',
  Fat_and_Oil: 'Fat_and_Oil',
  Snacks: 'Snacks',
  Milk_and_Yoghurt: 'Milk_and_Yoghurt',
  Drinks: 'Drinks',
} as const;
export type FoodCategory = (typeof FoodCategory)[keyof typeof FoodCategory];
export type CalorieNeed = {
  id: Generated<string>;
  calories: number;
  planNo: Generated<number>;
};
export type Card = {
  id: Generated<string>;
  token: string;
  email: string;
  first6Digits: string;
  last4Digits: string;
  issuer: string;
  type: string;
  processor: string;
  isDeleted: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
  userId: string;
};
export type FoodItem = {
  id: Generated<string>;
  name: string;
  category: FoodCategory;
  hasParts: Generated<boolean>;
  hasCookingMethods: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type FoodPortion = {
  id: Generated<string>;
  foodVariantId: string;
  calorie: string;
  size: string;
  description: string | null;
  createdAt: Generated<Timestamp>;
};
export type FoodVariant = {
  id: Generated<string>;
  foodId: string;
  name: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type MealPlan = {
  id: Generated<string>;
  day: string;
  breakfast: string;
  breakfastCalories: number;
  snackCalories: number;
  lunch: string;
  lunchCalories: number;
  dinner: string;
  dinnerCalories: number;
  calorieNeedId: string;
};
export type Recipe = {
  id: Generated<string>;
  name: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
  totalCalorie: number;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Snack = {
  id: Generated<string>;
  snack: string;
  calories: number;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Subscription = {
  id: Generated<string>;
  userId: string;
  transactionId: string;
  subscriptionPlanId: string;
  status: SubscriptionStatus;
  startDate: Generated<Timestamp>;
  endDate: Timestamp;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type SubscriptionPlan = {
  id: Generated<string>;
  planName: string;
  amount: string;
  isSpecialPlan: Generated<boolean>;
  hasCalorieCalculator: boolean;
  timetablePerMonth: number;
  noOfRecipes: string;
  mealPlanGuideLines: boolean;
  hasPreventHungerResources: boolean;
  hasMealPreppingResources: boolean;
  hasHandlingCheatMealResources: boolean;
  hasPostPurchaseSupport: boolean;
  hasQuickMealOptions: boolean;
  hasProgressReport: boolean;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type Transaction = {
  id: Generated<string>;
  userId: string;
  reference: Generated<string>;
  status: string;
  amount: string;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
  cardId: string;
};
export type User = {
  id: Generated<string>;
  email: string;
  phone: string;
  firstname: string;
  lastname: string;
  dateOfBirth: Timestamp | null;
  sex: string | null;
  height: string | null;
  weight: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  activityLevel: string | null;
  healthCondition: string | null;
  requiredCalorie: number | null;
  hasUsedFreeMealPlan: Generated<boolean>;
  isCreateMealPlanReminderSent: Generated<boolean>;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type UserMealPlan = {
  id: Generated<string>;
  plan: string;
  startDate: Generated<Timestamp>;
  endDate: Timestamp;
  userId: string;
};
export type DB = {
  CalorieNeed: CalorieNeed;
  Card: Card;
  FoodItem: FoodItem;
  FoodPortion: FoodPortion;
  FoodVariant: FoodVariant;
  MealPlan: MealPlan;
  Recipe: Recipe;
  Snack: Snack;
  Subscription: Subscription;
  SubscriptionPlan: SubscriptionPlan;
  Transaction: Transaction;
  User: User;
  UserMealPlan: UserMealPlan;
};
