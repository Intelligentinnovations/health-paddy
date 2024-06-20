import { SubscriptionStatus } from "./database";

export type UserPayload = {
    email: string;
    phone: string;
    firstname: string;
    lastname: string;
};


export type IUser = {
    id: string;
    email: string;
    phone: string;
    firstname: string;
    lastname: string;
    dateOfBirth: Date | null;
    sex: string | null;
    height: string | null;
    weight: string | null;
    subscriptionStatus: SubscriptionStatus | null
    activityLevel: string | null;
    healthCondition: string | null;
    requiredCalorie: number | null;
    hasUsedFreeMealPlan: boolean;
    createdAt: Date
    updatedAt: Date
}

