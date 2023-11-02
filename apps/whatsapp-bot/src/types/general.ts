import { User } from "./database";

export interface State {
    data: any,
    stage: string,
    user: User | undefined;
}