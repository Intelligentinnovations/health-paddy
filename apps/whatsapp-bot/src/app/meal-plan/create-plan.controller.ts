/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from "@nestjs/common";

import {
  calculateBMI,
  calculateRequireCalorie,
  delay,
  formatCurrency,
  parseDateOfBirth,
  sendWhatsAppText,
  validFeetAndInches
} from "../../helpers";
import {SubscriptionRepo, UserRepo} from "../../repo";
import { SecretsService } from "../../secrets/secrets.service";
import { PaymentService } from "../../services/paystack";
import {HealthGoal, IUser, State, SubscriptionPlan} from "../../types";
import {
  extremeGainWeightText,
  extremeWeightLossText,
  getActivityLevelText,
  getCalorieGoalText,
  healthConditionText,
  weightGainDurationText,
  weightLossDurationText
} from "../../utils/textMessages";
import { GenericService } from "../general";
import { ViewMealPlanService } from "./view-plan";


@Injectable()
export class CreateMealPlanService {
  constructor(
    private userRepo: UserRepo,
    private subscriptionRepo: SubscriptionRepo,
    private helper: GenericService,
    private viewMealPlan: ViewMealPlanService,
    private paymentService: PaymentService,
    private secrets: SecretsService
  ) {
  }

  handleCreateMealPlan = async ({
    phoneNumber,
    state,
    input
  }: {
    phoneNumber: string;
    state: State;
    input: number | string;
  }) => {
    try {
      const basePath = "create-meal-plan";
      const { stage } = state;

      if (stage === `${basePath}/age`) {
        const message = `Thanks! could you share your gender with me?\n
1. Male
2. Female`;
        const parsedDateOfBirth = parseDateOfBirth(input as string);
        if (parsedDateOfBirth === "Invalid date format") {
          return sendWhatsAppText({
            message: "Please enter a valid date of birth in this format (dd/mm/yyyy)",
            phoneNumber,
          });
        }
        await this.userRepo.updateUser({payload: {dateOfBirth: parsedDateOfBirth}, userId: state.user?.id as string})
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/gender`,
          state,
          data: { ...state.data, dateOfBirth: parsedDateOfBirth },
        });
      }
      if (stage === `${basePath}/gender`) {
        const gender = input == 1 ? "male" : input == 2 ? "female" : "";
        if (!gender) return  sendWhatsAppText({
            message: "Please choose between 1 and 2",
            phoneNumber,
          });

        const message = "Perfect!, May I ask for your height in feet, for example, in the format \"5f11\" or 5'11?";
        await this.userRepo.updateUser({payload: { sex: gender }, userId: state.user?.id as string})
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/height`,
          state,
          data: { ...state.data, gender },
        });
      }
      if (stage === `${basePath}/height`) {
        const validatedFeetAndInches = validFeetAndInches(input as string);
        if (!validatedFeetAndInches) return  sendWhatsAppText({
            message: "Please enter a valid height in feet, for example, in the format \"5f11\" or 5'11?",
            phoneNumber,
          });
        await this.userRepo.updateUser({payload: {height: input}, userId: state.user?.id as string})
        const message = "Excellent! Would you be willing to tell me your weight in KG? (e.g 70)";
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          nextStage: `${basePath}/weight`,
          state,
          data: { ...state.data, height: input },
        });
      }
      if (stage === `${basePath}/weight`) {
        const parsedWeight = Number(input);
        if (isNaN(parsedWeight))  return sendWhatsAppText({
            message: "Please enter a valid weight in KG (e.g 70)",
            phoneNumber,
          });

        const selectedGoal = state.data.goal;
        await this.userRepo.updateUser({payload: {weight: parsedWeight }, userId: state.user?.id as string})
        if (selectedGoal) {
          if (selectedGoal == "Maintain Weight") {
            return this.helper.sendTextAndSetCache({
              message: getActivityLevelText(),
              phoneNumber,
              state,
              nextStage: `${basePath}/activity-level`,
              data: { ...state.data, weight: parsedWeight },
            });
          }
          if (selectedGoal == "Lose Weight" || selectedGoal == "Gain Weight") {
            const initialMessage = selectedGoal == "Lose Weight"
              ? "You've made an empowering choice by selecting the Lose Weight option! 🌱🔥 Our meal plans are here to support you on your weight loss journey, guiding you towards a healthier, more vibrant you "
              : "Enjoy delicious and nourishing meals that promote muscle growth and help you gain healthy weight. Together, we'll lay a solid foundation for your progress!💫"
            await sendWhatsAppText({
              message: initialMessage, phoneNumber
            })
            await delay()
            const message = "What is your target weight in KG? (e.g 50)";
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message,
              nextStage: `${basePath}/target-weight`,
              state,
              data: {
                ...state.data,
                weight: parsedWeight
              },
            });
          }
        }
        else {
          const message = `What health goal do you want to achieve ?\n
1. Maintain Weight
2. Lose Weight
3. Gain Weight`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: `${basePath}/goal`,
            state,
            data: { ...state.data, weight: parsedWeight },
          });
        }
      }

      if (stage === `${basePath}/goal`) {
        if (input == HealthGoal["Maintain Weight"]) {
          return this.helper.sendTextAndSetCache({
            message: getActivityLevelText(),
            phoneNumber,
            state,
            nextStage: `${basePath}/activity-level`,
            data: { ...state.data, goal: "Maintain Weight" },
          });
        }
        if (
          input == HealthGoal["Lose Weight"] ||
          input == HealthGoal["Gain Weight"]
        ) {
          const initialMessage = input == HealthGoal["Lose Weight"]
            ? "You've made an empowering choice by selecting the Lose Weight option! 🌱🔥 Our meal plans are here to support you on your weight loss journey, guiding you towards a healthier, more vibrant you "
            : "Enjoy delicious and nourishing meals that promote muscle growth and help you gain healthy weight. Together, we'll lay a solid foundation for your progress!💫"
          await sendWhatsAppText({
            message: initialMessage, phoneNumber
          })
          await delay()
          const message = "What is your target weight in KG (e.g 50)";
          const goal = Object.keys(HealthGoal).find(
            (key) => HealthGoal[key] == input
          );

          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message,
            nextStage: `${basePath}/target-weight`,
            state,
            data: {
              ...state.data,
              goal
            },
          });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          nextStage: `${basePath}/goal`,
          state,
          message: "Please select between 1 to 3",
          data: state.data,
        });
      }

      if (stage === `${basePath}/target-weight`) {
        const parseTargetWeight = Number(input);
        if (isNaN(parseTargetWeight)) {
          await sendWhatsAppText({
            message: "Please enter a valid weight in KG (e.g 70)",
            phoneNumber,
          });
          return {
            status: "success",
          };
        }
        if (state.data.goal === "Lose Weight") {
          if (input >= state.data.weight) {
            return sendWhatsAppText({
              phoneNumber,
              message:
                "Your target weight should be less than your current weight to lose weight",
            });
          }
        } else {
          if (input <= state.data.weight) {
            return sendWhatsAppText({
              phoneNumber,
              message:
                "Your target weight should be more than your current weight to gain weight",
            });
          }
        }

        return this.helper.sendTextAndSetCache({
          phoneNumber,
          message: state.data.goal === "Gain Weight" ? weightGainDurationText : weightLossDurationText,
          nextStage: `${basePath}/goal-duration`,
          state,
          data: { ...state.data, targetWeight: Number(input) },
        });
      }
      if (stage === `${basePath}/goal-duration`) {
        const parsedDuration = Number(input);
        if (isNaN(parsedDuration)) {
          await sendWhatsAppText({
            message: "Please enter a valid duration in months",
            phoneNumber,
          });
          return {
            status: "success",
          };
        }
        const { targetWeight, weight: currentWeight } = state.data;
        if (state.data.goal == "Lose Weight") {
          const weightToLose = currentWeight - targetWeight;
          const weightLossPerMonth = weightToLose / Number(input);
          if (weightLossPerMonth > 8)
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message: extremeWeightLossText,
              nextStage: `${basePath}/extreme/weight-loss/gain`,
              state,
              data: state.data
            });
        } else {
          const weightToGain = targetWeight - currentWeight;
          const weightGainPerMonth = weightToGain / Number(input);
          if (weightGainPerMonth > 2.5)
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message: extremeGainWeightText,
              nextStage: `${basePath}/extreme/weight-loss/gain`,
              state,
              data: state.data
            });
        }
        return this.helper.sendTextAndSetCache({
          phoneNumber,
          message: getActivityLevelText(),
          nextStage: `${basePath}/activity-level`,
          state,
          data: { ...state.data, durationInMonth: Number(input) },
        });
      }

      if (stage === `${basePath}/extreme/weight-loss/gain`) {
        if (input == 1) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: "Please re - enter a duration in months (e.g 2)",
            nextStage: `${basePath}/goal-duration`,
            state,
            data: state.data
          });
        }

        if (input == 2) {
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: "Please re - enter your target weight in KG (e.g 70)",
            nextStage: `${basePath}/target-weight`,
            state,
            data: state.data
          });
        }
      }

      if (stage === `${basePath}/activity-level`) {
        const activityLevel =
          input == 1
            ? "sedentary"
            : input == 2
              ? "mild"
              : input == 3
                ? "moderate"
                : input == 4
                  ? "heavy"
                  : input == 5
                    ? "extreme"
                    : "";
        if (!activityLevel) {
          await sendWhatsAppText({
            message: "Please select an activity level",
            phoneNumber,
          });
          return {
            status: "success",
          };
        }
        return this.helper.sendTextAndSetCache({
          message: healthConditionText,
          phoneNumber,
          nextStage: `${basePath}/health-condition`,
          state,
          data: { ...state.data, activityLevel },
        });
      }
      if (stage === `${basePath}/health-condition`) {
        const healthCondition =
          input == 1
            ? "none"
            : input == 2
              ? "hypertension"
              : input == 3
                ? "diabetes/pre-diabetes"
                : input == 4
                  ? "high cholesterol"
                  : input == 5
                    ? "polycystic Ovary Syndrome (PCOS)"
                    : input == 6
                      ? "pregnant" :
                      input == 7
                        ? "breastfeeding"
                        : "";

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
          inches:  value?.inches as number,
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
            healthCondition,
            requiredCalorie,
          },
          userId: state.user!.id,
        });

        if (healthCondition === "none") {
          const parsedWeight = weight ? weight : Number(savedWeight)
          const weightDifference = Math.abs(parsedWeight - targetWeight);
          const {
            bmi,
            description: bmiDescription
          } = calculateBMI({ weightInKg: parsedWeight , feet: value!.feet, inches: value!.inches })

          await this.helper.sendTextAndSetCache({
            message: `${getCalorieGoalText({
              goal,
              requiredCalorie,
              durationInMonth,
              weightDifference: Math.trunc(weightDifference)
            })}. \nYour current BMI is ${bmi} (${bmiDescription})`,
            phoneNumber,
            nextStage: "",
            state: { ...state, user: updatedUser },
            data: { ...state.data, healthCondition },
          });

          if (requiredCalorie as number > 2300 || requiredCalorie! < 1200) return this.helper.sendTextAndSetCache({
            message: `Sorry we do not have any meal plans at the moment to meet your daily calorie needs.
However, you can speak to one of our representatives to create a custom meal plan by clicking on this link https://wa.link/0ubqh3`,
            phoneNumber,
            nextStage: "landing",
            state
          })

          await delay()
          await this.helper.sendTextAndSetCache({
            message: `Would you like us to create a Nigerian meal plan that will provide you ${requiredCalorie} cal per day towards achieving your goal?\n
1. Absolutely
2. No, thank you, I'm good`,
            phoneNumber,
            state: { ...state, user: updatedUser },
            nextStage: `${basePath}/should-generate-meal-plan`,
          })
        } else {
          const specialHealthPlan = await this.subscriptionRepo.fetchSpecialSubscriptionPlan();
          const data = { ...state.data, healthCondition, specialHealthPlan }
          const message = `Considering your (${healthCondition}), your plan must be fully customized to you! To help us do that we'll like to collect some additional information.\n\nPlease note that our customized meal plans are ${formatCurrency(+specialHealthPlan!.amount)} only.\n\nAfter payment, we'll send you a link to a form. You'll be filling in your health data and food likes, so we can tailor your plan to you `;
          await this.helper.sendTextAndSetCache({
            phoneNumber,
            message,
            nextStage: `${basePath}/health-condition/help`,
            state,
            data,
          });

          await this.helper.sendWhatsAppImageByIdAndSetCache({
            phoneNumber,
            state,
            nextStage: `${basePath}/health-condition/help`,
            data,
            imageObjectId: this.secrets.get("CUSTOMIZED_MEAL_PLAN_IMAGE_ID")
          })
          await delay()
          return sendWhatsAppText({
            message: `Do you have any questions?
1. Yes
2. No`,
            phoneNumber
          })
        }
      }
      const ACCEPT = 1;
      const DECLINE = 2;


      if (stage == `${basePath}/health-condition/help`) {
        if (input == ACCEPT) {
          return sendWhatsAppText({
            message: `We are happy to provide you with the support you need to make a decision. Please click on the link ${this.secrets.get("CUSTOMER_REP_CHAT_LINK")} to speak with one of our sales representatives.`,
            phoneNumber
          })

        }
        else {
          const { healthCondition, specialHealthPlan } = state.data as { specialHealthPlan: SubscriptionPlan, healthCondition: string }
          const paymentLink = await this.paymentService.initializePaystackPayment({
            email: state!.user!.email,
            amountInNaira: Number(specialHealthPlan!.amount),
            metaData: { phoneNumber, planPaidFor: specialHealthPlan, state },
            callbackUrl: this.secrets.get("PAYSTACK_WEBHOOK"),
          })

          const { data } = paymentLink;
          return this.helper.sendTextAndSetCache({
            phoneNumber,
            message: `Please click on the link ${data.data.authorization_url} to make payment`,
            nextStage: "landing",
            state,
            data: { ...state.data, healthCondition },
          });
        }
      }

      if (stage == `${basePath}/should-generate-meal-plan`) {
        if (input == ACCEPT) {
          return this.viewMealPlan.handleViewMealPlan({
            phoneNumber,
            state,
          });
        }
        if (input == DECLINE) {
          return this.helper.handleNoState({
            phoneNumber,
            profileName: state.user!.firstname,
            customHeader: "Thank you for using Health Paddy, we look forward to helping you on your health journey soon. However, feel free to explore our calorie bank to check how many calories are in different Nigerian meals",
            state,
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  };
}
