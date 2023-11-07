import { SubscriptionStatus, User } from "./database";

export interface State {
    data: any,
    stage: string,
    user: User | undefined;
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
    subscriptionstatus: SubscriptionStatus,
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
    height: number
    weight: number
    gender: 'male' | 'female',
    activityLevel: 'sedentary' | 'mild' | 'moderate' | 'heavy' | 'extreme'
}