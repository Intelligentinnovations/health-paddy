import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Inject } from "@nestjs/common";
import { Cache } from "cache-manager";
import { DateTime } from "luxon";

import { formatCurrency } from "../../helpers";
import { SecretsService } from "../../secrets/secrets.service";
import { PaymentService } from "../../services/paystack";
import { State, SubscriptionPlan } from "../../types";
import { AppRepo } from "../app.repo";
import { GenericService } from "../general";



export class HandlePayment {
  constructor(
    private paymentService: PaymentService,
    private repo: AppRepo,
    private generalResponse: GenericService,
    private secrets: SecretsService,

    @Inject(CACHE_MANAGER) private cacheManager: Cache

  ) {
  }

  public async handlePaystackTransaction(reference: string) {
    try {
      const verification = await this.paymentService.verifyPaystackTransaction(reference);
      const {status, data} = verification;
      const transactionExist = await this.repo.findTransactionByReference(
        reference
      );
      if (transactionExist) return;

      const {
        status: transactionStatus,
        amount: amountInKobo,
        authorization,
        customer: {email},
      } = data.data;
      const {
        phoneNumber,
        planPaidFor,
        state
      } = data.data.metadata.custom_fields[0] as { phoneNumber: string, planPaidFor: SubscriptionPlan, state: State }


      const {
        bin: first6Digits,
        last4: last4Digits,
        brand: issuer,
        authorization_code: token,
      } = authorization;

      const amountInNaira = amountInKobo / 100;
      const today = DateTime.now();
      const endDate = today.plus({months: 1}).toJSDate();


      if (status && transactionStatus === "success") {
        const userId = state.user?.id as string

        await this.repo.createSubscription({
          subscriptionPlanId: planPaidFor?.id as unknown as string,
          token,
          type: "",
          issuer,
          userId,
          processor: "paystack",
          date: new Date(),
          last4Digits,
          first6Digits,
          email,
          endDate,
          transactionStatus,
          amount: `${amountInNaira}`,
          reference,
        });

        // @ts-ignore
        const isNotSpecialPlan = planPaidFor.isSpecialPlan === "false"
        const message = `Subscription alert\n
Congratulations!!! 🧱🧱🧱
We are so excited you've taken this step to better your health and smash your fitness goals! 💃🏽
Here are the details of your current subscription:\n
Plan: ${planPaidFor.planName}
Amount paid: ${formatCurrency(Number(amountInNaira))}
Expires on: ${endDate.toDateString()}\n
${isNotSpecialPlan ? "PS. A downloadable PDF version of the plan has been sent to your email, along with your other resources." : ""}`
          await this.generalResponse.sendTextAndSetCache({
            message,
            phoneNumber,
            state: {data: {}, stage: "", user: undefined},
            nextStage: ""
          })
        if (isNotSpecialPlan) {
          await this.repo.deleteCurrentMealPlan(state.user?.id as string) // delete previous meal plan from db
          const cacheKey = `${state?.user?.phone}-meal-plan`;
          await this.cacheManager.del(cacheKey) // remove previous meal plan from memory
          const user = await this.repo.findUserByPhoneNumber(phoneNumber);
          return this.generalResponse.generateAndSendMealPlan({
            phoneNumber,
            state: {data: {}, stage: "", user},
          })
          // Todo send email
        } else {
          const message = `Thank you for subscribing to our custom plan, kindly complete this short form ${this.secrets.get("HEALTH_ISSUES_FORM_LINK")} . It will help us create a meal plan specific to your unique needs and health goals`
          await this.generalResponse.sendTextAndSetCache({
            message,
            phoneNumber,
            state: {data: {}, stage: "", user: undefined},
            nextStage: "",
            data,
          })
        }
      }
    }
    catch (error) {
      console.log({error})
    }
  }
}
