import { GetCalorieGoalText } from "../../types"

export const getActivityLevelText = (goal: string) => `Congratulations on selecting the ${goal} option!🏋️🌱Let our meal plans support you in staying at your healthy weight, while still enjoying delightful and 
flavorful dishes. Please, Select your most appropriate activity level?\n
1. Sedentary (little to no regular exercise).\n
2. Mild activity (intense exercise for at least 20 minutes 1-3 times per week. This may include things like brisk walking 🚶‍♂️, bicycling 🚴‍♀️, jogging 🏃‍♂️, basketball🏀, swimming 🏊 etc. If you do not exercise regularly, but you maintain a busy life that requires you to walk frequently for long periods, you meet the requirements for this level).\n
3. Moderate activity (intense exercise for 60 min 3 to 4 times per week. Any of the activities listed above will qualify)\n
4. Heavy or labor-intensive activity (intense exercise for 60min or greater, 5 to 7 days per week. Labor intensive occupations also qualify for this level, such as bricklaying 🧱🔨, carpentry 🧱🔨, general labor 👷‍♂️💪, farming 🌾🚜etc.).\n
5. Extreme activity (Exceedingly active and/ or very demanding activities, such as athlete with an almost unstoppable training schedule 🏋️‍♂️📅, very demanding jobs such as shovelling coal or working long hours on an assembly line)`


export const extremeGainWeightText = `Trust me I get it, you want results really quick! But when you gain weight too quickly, you tend to gain a lot of unhealthy fat. Weight should be gained at a moderate pace of 1 - 2kg per month, you should either increase the duration or reduce your target weight\n
1) Increase Duration
2) Reduce Target Weight`

export const extremeWeightLossText = `Trust me I get it, you want to lose the weight as fast as possible. But it seems you are trying to lose more than 8kg per month, and that's highly unrealistic. you should either increase the duration or reduce your target weight\n
1) Increase Duration
2) Reduce Target Weight`

export const healthConditionText = `Finally, are you managing any of these health conditions?\n
1. None
2. Hypertension
3. Diabetes
4. Pre-diabetes
5. High Cholesterol`

export const weightLossDurationText = `In how many months would you like to achieve this goal? (Please be realistic here. Extreme weight loss is rarely ever sustainable, we recommend a target of 5kg or less per month)`

export const getCalorieGoalText = ({ goal, requiredCalorie, userName, durationInMonth, weightDifference }: GetCalorieGoalText) =>
  goal === 'Maintain Weight'
    ? `Thank you ${userName}, to maintain your current weight, you will be needing ${requiredCalorie} Cal per day`
    : goal === 'Loose Weight'
      ? `To loose ${weightDifference}KG over the next ${durationInMonth} months, at your current level of activity and weight, you'll need to consume: ${requiredCalorie}cal per day`
      : `To gain ${weightDifference}KG over the next ${durationInMonth} months, at your current level of activity and weight, you'll need to consume: ${requiredCalorie}cal per day`
