import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
} as const;
export type SubscriptionStatus =
  typeof SubscriptionStatus[keyof typeof SubscriptionStatus];
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
export type Subscription = {
  id: Generated<string>;
  userId: string;
  transactionId: string;
  status: SubscriptionStatus;
  startDate: Generated<Timestamp>;
  endDate: Timestamp;
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
  name: string;
  age: number | null;
  sex: string | null;
  height: string | null;
  weight: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  createdAt: Generated<Timestamp>;
  updatedAt: Timestamp;
};
export type DB = {
  Card: Card;
  Subscription: Subscription;
  Transaction: Transaction;
  User: User;
};
