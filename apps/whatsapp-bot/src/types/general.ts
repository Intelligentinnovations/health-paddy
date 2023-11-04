import { SubscriptionStatus, User } from "./database";

export interface State {
    data: any,
    stage: string,
    user: User | undefined;
}


export interface SubscriptionPayload {
    userId: string,
    reference: string,
    status: SubscriptionStatus,
    token: string,
    email: string,
    first6Digits: string,
    last4Digits: string,
    issuer: string,
    type: string,
    processor: string,
    date: Date,
    endDate: Date,
    amount: string
}