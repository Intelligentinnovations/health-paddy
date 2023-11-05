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