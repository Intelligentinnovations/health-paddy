
export type UserData = {
  email: string;
  roles: string[];
};


export type SubscriptionStatus = {
  active: "active",
  expired: "expired",
  canceled: "canceled"
}


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
  subscriptionStatus: "active" | "expired" | "canceled" | null
  activityLevel: string | null;
  healthCondition: string | null;
  requiredCalorie: number | null;
  hasUsedFreeMealPlan: boolean;
  createdAt: Date
  updatedAt: Date
}