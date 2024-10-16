import { SubscriptionStatus } from "./database";

export type UserPayload = {
    email: string;
    phone: string;
    name: string;
};


export type IUser = {
    id: string;
    email: string;
    phone: string;
    name: string;
    age: number | null;
    sex: string | null;
    height: string | null;
    weight: string | null;
    subscriptionStatus: SubscriptionStatus | null
    activityLevel: string | null;
    healthCondition: string | null;
    requiredCalorie: number | null;
    hasUsedFreeTrial: boolean;
    createdAt: Date
    updatedAt: Date
}