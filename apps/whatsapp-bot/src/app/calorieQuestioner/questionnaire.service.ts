import {
  ActivityLevelPayload,
  BioDataPayload,
  GoalDurationPayload, HealthConditionPayload,
  HealthGoalPayload,
  IServiceHelper,
  TargetWeightPayload
} from "@backend-template/types";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";

import {
  calculateBMI,
  calculateRequireCalorie,
  delay,
  formatCurrency,
  validFeetAndInches
} from "../../helpers";
import { SubscriptionRepo, UserRepo } from "../../repo";
import { IUser, State, UserPayload } from "../../types";
import { extremeGainWeightText, getCalorieGoalText } from "../../utils/textMessages";


@Injectable()
export class QuestionnaireService {
  constructor(
    private userRepo: UserRepo,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private subscriptionRepo: SubscriptionRepo
  ) {
  }
  async saveUserData(payload: UserPayload): Promise<IServiceHelper> {
    let user = await this.userRepo.findUserByPhoneNumber(payload.phone);
    if (!user) {
      user = await this.userRepo.createUser(payload);
    }

    let state = await this.cacheManager.get<State>(payload.phone);

    const initialState: State = {
      stage: "goal",
      user: undefined,
      data: state?.data
    };
    state = { ...initialState, user }
    await this.cacheManager.set(payload.phone, state);

    return {
      status: "successful",
      message: "account created successfully"
    }
  }

  async submitGoal(payload: HealthGoalPayload): Promise<IServiceHelper> {
    const state = await this.cacheManager.get<State>(payload.phone);
    if (!state?.user?.id) return {
      status: "bad-request",
      message: "Please start by entering your email"
    }
    if (state.stage !== "goal") return { status: "bad-request", message: "Please start all over" }


    const selectedGoal = payload.goal.toLowerCase()
    this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: "bio-data",
      data: { ...state.data, goal: selectedGoal }
    });

    return {
      status: "successful",
      message: "Goal submitted successfully"
    }
  }

  async submitBioData(payload: BioDataPayload): Promise<IServiceHelper> {
    const state = await this.cacheManager.get<State>(payload.phone);

    if (!state?.user?.id) return {
      status: "bad-request",
      message: "Please start over from the start"
    }
    console.log(state.stage);

    if (state.stage !== "bio-data") return {
      status: "bad-request",
      message: "Please start with your bio data"
    }
    const nextStage = state.data.goal === "maintain-weight" ? "activity-level" : "target-weight"
    await this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: nextStage,
      data: { ...state.data, ...payload }
    });
    return { status: "successful", message: "Bio-data submitted successfully" }
  }

  async submitTargetWeight(payload: TargetWeightPayload): Promise<IServiceHelper> {
    const targetWeight = payload.targetWeight;
    const state = await this.cacheManager.get<State>(payload.phone);
    if (!state?.user?.id) return {
      status: "bad-request",
      message: "Please start from the beginning"
    }
    const selectedGoal = state.data.goal
    if (selectedGoal === "lose-weight" || selectedGoal === "gain-weight") {
      if (selectedGoal === "lose-weight" && targetWeight >= state.data.weight) {
        return {
          status: "bad-request",
          message: "Your target weight should be less than your current weight to lose weight"
        };
      }
      if (selectedGoal === "gain-weight" && targetWeight <= state.data.weight) {
        return {
          status: "bad-request",
          message: "Your target weight should be more than your current weight to gain weight"
        };
      }
    }
    this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: "goal-duration",
      data: { ...state.data, ...payload }
    });
    return { status: "successful", message: "Target weight submitted successfully" }
  }

  async submitGoalDuration(payload: GoalDurationPayload): Promise<IServiceHelper> {
    const state = await this.cacheManager.get<State>(payload.phone);

    if (!state?.user?.id) return { status: "bad-request", message: "Please start from the beginning" }
    if (state.stage !== "goal-duration") return { status: "bad-request", message: "Please start over" }
    const { targetWeight, weight: currentWeight } = state.data;

    if (state.data.goal == "Lose Weight") {
      const weightToLose = currentWeight - targetWeight;
      const weightLossPerMonth = weightToLose / Number(payload.durationInMonth);
      if (weightLossPerMonth > 8)
        await this.cacheManager.set(payload.phone, {
          user: state.user,
          stage: "extreme/weight-loss/gain",
          data: { ...state.data }
        });
    } else {
      const weightToGain = targetWeight - currentWeight;
      const weightGainPerMonth = weightToGain / Number(payload.durationInMonth);
      if (weightGainPerMonth > 2.5) {
        await this.cacheManager.set(payload.phone, {
          user: state.user,
          stage: "extreme/weight-loss/gain",
          data: { ...state.data }
        });
        return { status: "bad-request", message: extremeGainWeightText }
      }
    }
    await this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: "activity-level",
      data: { ...state.data, ...payload }
    });
    return { status: "successful", message: "Goal duration submitted successfully" }
  }

  async submitActivityLevel(payload: ActivityLevelPayload): Promise<IServiceHelper> {
    const state = await this.cacheManager.get<State>(payload.phone);
    if (!state?.user?.id) return { status: "bad-request", message: "Please start from the beginning" };
    if (state.stage !== "activity-level") return { status: "bad-request", message: "Please start over" };
    await this.cacheManager.set(payload.phone, {
      user: state.user,
      stage: "health-goal",
      data: { ...state.data, ...payload }
    });
    return { status: "successful", message: "Activity level submitted successfully" }
  }

  async submitHealthCondition(payload: HealthConditionPayload): Promise<IServiceHelper> {
    const state = await this.cacheManager.get<State>(payload.phone) as State;
    console.log({ state });

    const {
      data: {
        dateOfBirth,
        activityLevel,
        gender,
        height,
        weight,
        goal,
        targetWeight,
        durationInMonth,
      },
    } = state;
    const {
      dateOfBirth: savedDateOfBirth,
      weight: savedWeight,
      height: savedHeight,
      sex: savedGender
    } = state.user as IUser

    const value = validFeetAndInches(height || savedHeight);
    const requiredCalorie = calculateRequireCalorie({
      dateOfBirth: dateOfBirth || savedDateOfBirth,
      inches: value?.inches as number,
      feet: value?.feet as number,
      weight: weight || savedWeight,
      gender: gender || savedGender,
      activityLevel,
      goal,
      targetWeight,
      durationInMonth,
    });

    const updatedUser = await this.userRepo.updateUser({
      payload: {
        dateOfBirth,
        activityLevel,
        sex: gender,
        height,
        weight,
        healthCondition: payload.healthCondition,
        requiredCalorie,
      },
      userId: state.user!.id,
    });

    const parsedWeight = weight ? weight : Number(savedWeight)
    const {
      bmi,
      description: bmiDescription
    } = calculateBMI({ weightInKg: parsedWeight || 0, feet: value?.feet || 0, inches: value?.inches || 0 })
    
    if (typeof requiredCalorie === "number" && (requiredCalorie > 2300 || requiredCalorie < 1200)) {
      return {
        status: "successful",
        message: "Sorry we do not have any meal plans at the moment to meet your daily calorie needs. However, you can speak to one of our representatives to create a custom meal plan by clicking on this link https://wa.link/0ubqh3"
      };
    }
    if (payload.healthCondition === "none") {
      await this.cacheManager.set(payload.phone, {
        user: state.user,
        stage: "health-goal",
        data: {
          ...state.data,
          healthCondition: payload.healthCondition
        }
      });
      await delay();
      await this.cacheManager.set(payload.phone, {
        stage: "should-generate-meal-plan",
        state: { ...state, user: updatedUser },
        data: {
          ...state.data,
          healthCondition: payload.healthCondition
        }
      });

      return {
        status: "successful",
        message: "Congratulations, we have successfully calculated your calorie targrt",
        data: {
          goal,
          requiredCalorie,
          bmi,
          bmiDescription,
          targetWeight,
          durationInMonth
        }
      }

    } else {
      const specialHealthPlan = await this.subscriptionRepo.fetchSpecialSubscriptionPlan();
      const data = {
        ...state.data,
        healthCondition: payload.healthCondition,
        specialHealthPlan
      }
      const message = `Considering your (${payload.healthCondition}), your plan must be fully customized to you! To help us do that we'll like to collect some additional information.\n\nPlease note that our customized meal plans are ${formatCurrency(+specialHealthPlan!.amount)} only.\n\nAfter payment, we'll send you a link to a form. You'll be filling in your health data and food likes, so we can tailor your plan to you `;

      await this.cacheManager.set(payload.phone, {
        stage: "health-condition/help",
        state,
        data,
      });

      return {
        status: "successful",
        message: message,
        data: {
          goal,
          requiredCalorie,
          bmi,
          bmiDescription,
          targetWeight,
          durationInMonth
        }
      };
    }
  }
}
