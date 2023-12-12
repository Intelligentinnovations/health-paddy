import { SubscriptionStatus } from "./database";
import { IUser } from "./user";

export interface State {
    data: any,
    stage: string,
    user: IUser | undefined;
}


export interface SubscriptionPayload {
    userId: string,
    reference: string,
    token: string,
    email: string,
    first6Digits: string,
    last4Digits: string,
    issuer: string,
    type: string,
    processor: string,
    date: Date,
    endDate: Date,
    amount: string,
    subscriptionStatus: SubscriptionStatus,
    transactionStatus: string
}

export const ActivityLevel = {
    sedentary: 1.2,
    mild: 1.375,
    moderate: 1.55,
    heavy: 1.7,
    extreme: 1.9
}


export interface CalorieCalculator {
    age: number,
    weight: number
    gender: 'male' | 'female',
    activityLevel: 'sedentary' | 'mild' | 'moderate' | 'heavy' | 'extreme',
    feet: number,
    inches: number,
    goal: string,
    targetWeight: number,
    durationInMonth: number
}

export const HealthGoal: { [key: string]: number } = {
    'Maintain Weight': 1,
    'Loose Weight': 2,
    'Gain Weight': 3
}


export interface GetCalorieGoalText {
    goal: string,
    requiredCalorie: number,
    userName: string,
    durationInMonth: number,
    weightDifference: number
}