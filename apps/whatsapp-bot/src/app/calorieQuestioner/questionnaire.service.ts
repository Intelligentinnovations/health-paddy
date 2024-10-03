import {Inject, Injectable} from "@nestjs/common";
import {CalculateCalorieSchema} from "@backend-template/types";
import {UserRepo} from "../../repo";
import {State, UserPayload} from "../../types";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import { Cache } from "cache-manager";


@Injectable()
export class QuestionerService {
  constructor(
    private userRepo: UserRepo,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
  }
    async saveUserData(payload: UserPayload) {
        const user = await this.userRepo.findUserByPhoneNumber(payload.phone);
        if(!user){
        return this.userRepo.createUser(payload)
        }
      let state = await this.cacheManager.get<State>(payload.phone);
      if (!state?.user?.id) {
        const initialState: State = {
          stage: state?.stage || "goal",
          user: undefined,
          data: state?.data
        };
        state = {...initialState, user}
        await this.cacheManager.set(payload.phone, state);
      }
    }

  async processResponse(payload: any) {
    const phone = payload?.phoneNumber as string;
    const state = await this.cacheManager.get<State>(phone);
    if(!state?.user?.id) return "Please start with your bio data"
    const goals = ['lose weight', 'maintain-weight', 'gain-weight']

    if(state.stage === 'goal'){
      const selectedGoal = goals.find(i => i === payload.goal.toLowerCase())
      if(!selectedGoal) return "please select a goal between lose weight', 'maintain-weight' and 'gain-weight"

      // if(payload?.goal && )
    }

  }
}
