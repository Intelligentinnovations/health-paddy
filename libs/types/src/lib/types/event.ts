import { IUser } from "./user";

export type MessageBody = {
  eventType: EventType;
  reference?: string
  data?: {
    input: string,
    phoneNumber: string,
    profileName: string,
    state: State
  }
};


export enum EventType {
  MESSAGE = "MESSAGE",
  PAYMENT = "PAYMENT"

}

export interface State {
  data: any,
  stage: string,
  user: IUser | undefined;
}

export const ScheduleType = {
  SCHEDULE_ONE: "SCHEDULE_ONE",
} as const;

export type ScheduleType = typeof ScheduleType[keyof typeof ScheduleType];
