/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable} from "@nestjs/common";

import {delay} from "../../helpers";
import {SecretsService} from "../../secrets/secrets.service";
import {State} from "../../types";
import {getSubscriptionPlanMessage} from "../../utils/textMessages";
import {AppRepo} from "../app.repo";
import {GenericService} from "../general";


@Injectable()
export class ViewMealPlanService {
  constructor(
    private helper: GenericService,
    private secrets: SecretsService,
    private repo: AppRepo,
  ) { }

  handleViewMealPlan = async ({
    phoneNumber,
    state
  }: {
    phoneNumber: string;
    state: State
  }) => {
    const {user} = state
    try {
      if(user?.hasUsedFreeMealPlan){
        if (user?.subscriptionStatus === "expired" || user?.subscriptionStatus === null) {
        return this.helper.handlePaymentNotification({
          phoneNumber,
          state
        })
        }
      }
      else {
        await this.helper.sendTextAndSetCache({
          message: "Awesome choice! We hope you are as excited as we are to create your plan! Just as a teaser, here is what your Nigerian-based meal plan could look like",
          phoneNumber,
          state,
          nextStage: ""
        })
        await delay()
      await this.helper.generateAndSendMealPlan({state, phoneNumber})
        const nextStage = "subscription-acceptance";
        await delay()
        await this.helper.sendWhatsAppImageByIdAndSetCache({
          phoneNumber,
          imageObjectId: this.secrets.get("SUBSCRIPTION_IMAGE_ID"),
          state,
          nextStage
        })
        await delay()
        const subscriptionPlans = await this.repo.fetchSubscriptionPlans();
        // @ts-ignore
        const subscriptionMessage = getSubscriptionPlanMessage(subscriptionPlans, "To get access to the full meal plan for 30 days")
        return this.helper.sendTextAndSetCache({
          message: subscriptionMessage,
          phoneNumber,
          state,
          nextStage,
          data: { subscriptionPlans, isFirstTimeSubscriber: true },
        })

      }
    } catch (err) {
      console.log(err);

    }
  }
}
