
/* eslint-disable @typescript-eslint/no-var-requires */

const subscriptionPlans = [
  {
    planName: "Basic Plan",
    amount: 3000,
    isSpecialPlan: false,
    hasCalorieCalculator: true,
    timetablePerMonth: 1,
    hasSwapMealItem: true,
    noOfRecipes: 5,
    mealPlanGuideLines: true,
    hasPreventHungerResources: true,
    hasMealPreppingResources: false,
    hasHandlingCheatMealResources: false,
    hasPostPurchaseSupport: true,
    hasCommunity: false,
    hasQuickMealOptions: false,
    hasProgressReport: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    planName: "Premium Plan",
    amount: 9500,
    isSpecialPlan: false,
    hasCalorieCalculator: true,
    timetablePerMonth: 1,
    hasSwapMealItem: true,
    noOfRecipes: 5,
    mealPlanGuideLines: true,
    hasPreventHungerResources: true,
    hasMealPreppingResources: true,
    hasHandlingCheatMealResources: true,
    hasPostPurchaseSupport: true,
    hasCommunity: true,
    hasQuickMealOptions: true,
    hasProgressReport: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    planName: "Special Health Plan",
    amount: 30000,
    isSpecialPlan: true,
    hasCalorieCalculator: true,
    timetablePerMonth: 1,
    hasSwapMealItem: true,
    noOfRecipes: 5,
    mealPlanGuideLines: true,
    hasPreventHungerResources: true,
    hasMealPreppingResources: true,
    hasHandlingCheatMealResources: true,
    hasPostPurchaseSupport: true,
    hasCommunity: true,
    hasQuickMealOptions: true,
    hasProgressReport: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
async function seedSubscriptionPlan(db: any) {

  await db.transaction().execute(async (trx: any) => {
    await trx
      .insertInto('SubscriptionPlan')
      .values(subscriptionPlans)
      .execute()
  })

}

module.exports = seedSubscriptionPlan