import { formatCurrency } from '../../helpers';
import { State, SubscriptionPlan } from '../../types';

export const privacyMessage = (goal: string) => `Privacy Notice

Fantastic! Here's what's going to happen next, we will:\n
1. Help you calculate your daily calorie allowance for optimal ${goal}
2. Create a Nigerian meal plan based on your calorie target.

We may collect the following personal data:
- Name
- Age
- Gender
- Height
- Weight
- Activity level
- Dietary preferences

How We Use Your Information
- Calculate your estimated daily calorie requirements
- Provide personalized nutrition and fitness recommendations
- Improve our services
- Respond to your inquiries

Data Security
We prioritize the security of your personal data. We implement measures to protect your data from unauthorized access, disclosure, alteration, and destruction.

Consent
By using our chat-bot, you consent to the collection and use of your personal data as described in this privacy notice.

1. Accept
2. Reject`

export const getSelectionMessage = ({ heading, state, selectionOffset }: { heading: string; state: State, selectionOffset: number }) => {
  if (state.user) {
    return `${heading}\n
${state.user.subscriptionStatus != 'active' ? '1. Create Meal Plan 🍽️' : ""}
${2 - selectionOffset}. View My Meal Plan 📋
${3 - selectionOffset}. View Your Recipe List 📖
${4 - selectionOffset}. Log a Complaint 📢
${5 - selectionOffset}. Manage Subscription ✉️`;
  } else {
    return `${heading}\n
1. Lose weight and get healthier
2. Maintain my weight and improve my health
3. Add weight in the healthiest way`
  }
}


export const getSubscriptionPlanMessage = (subscriptionPlans: SubscriptionPlan[]) => `*Subscription alert*\n
Please select one of our subscription plan to create your meal plans, or simply click on this link below to learn more about all available plans.\n
${subscriptionPlans.map((plan, index) => `${index + 1}. *${plan.planName} ${formatCurrency(Number(plan.amount))}/Month*
- Calorie calculator ${plan.hasCalorieCalculator ? ' ✅' : '❌'}
- Timetable/month ${plan.timetablePerMonth}
- Swap meal item ${plan.hasSwapMealItem ? '✅' : '❌'}
- No of recipes ${plan.noOfRecipes}
- Meal plan Guidelines ${plan.mealPlanGuideLines ? '✅' : '❌'}
- Video resources to prevent hunger and stay fuller ${plan.hasPreventHungerResources ? '✅' : '❌'}
- Video resources for time-efficient meal-prepping tips ${plan.hasMealPreppingResources ? '✅' : '❌'}
- Video resources for handling your cheat meals like a PRO ${plan.hasHandlingCheatMealResources ? '✅' : '❌'}
- Post purchase support ${plan.hasPostPurchaseSupport ? '✅' : '❌'}
- Community ${plan.hasCommunity ? '✅' : '❌'}
- Quick meal options ${plan.hasQuickMealOptions ? '✅' : '❌'}
- Progress report ${plan.hasProgressReport ? '✅' : '❌'}\n\n`
).join('')}`
