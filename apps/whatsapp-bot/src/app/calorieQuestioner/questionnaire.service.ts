import {Inject, Injectable} from "@nestjs/common";
import {BioDataPayload, HealthGoalPayload, TargetWeightPayload} from "@backend-template/types";
import {UserRepo} from "../../repo";
import {State, UserPayload} from "../../types";
import {CACHE_MANAGER} from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {sendWhatsAppText} from "../../helpers";


@Injectable()
export class QuestionnaireService {
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

  async submitGoal(payload: HealthGoalPayload) {
    const state = await this.cacheManager.get<State>(payload.phone);
    if(!state?.user?.id) return "Please start with your bio data"
    if(state.stage === 'goal'){
      const selectedGoal = payload.goal.toLowerCase()
      this.cacheManager.set(payload.phone, {
        user: state.user,
        stage: 'bio-data',
        data: {...state.data, goal: selectedGoal}
      });
    }
    return "Goal submitted successfully"
  }

  async submitBioData(payload: BioDataPayload) {
    const state = await this.cacheManager.get<State>(payload.phone);
    if(!state?.user?.id) return
    if(state.stage !== 'goal') return "Please start with your bio data"
    const nextStage = state.data.goal === 'maintain-weight' ? 'activity-level': 'target-weight'
    this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: nextStage,
      data: {...state.data, payload}
    });
    return "Bio-data submitted successfully"
}

  async submitTargetWeight(payload: TargetWeightPayload) {
    const targetWeight = payload.weight;
    const state = await this.cacheManager.get<State>(payload.phone);
    if(!state?.user?.id) return "Please start from the beginning"
    if(state.stage !== 'target-weight') return "Please start over"
    const selectedGoal = state.data.goal
    if(selectedGoal === 'lose-weight'){
      if (targetWeight >= state.data.weight) {
        return "Your target weight should be less than your current weight to lose weight";
      }
      else if (targetWeight <= state.data.weight) {
        return "Your target weight should be more than your current weight to gain weight";
      }
    }
    this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: 'activity-level',
      data: {...state.data, payload}
    });
    return "Target weight submitted successfully"
  }
}
