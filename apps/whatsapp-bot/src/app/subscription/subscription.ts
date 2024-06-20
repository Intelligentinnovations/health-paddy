/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from "@nestjs/common";
import { DateTime } from "luxon";

import { capitalizeString, formatCurrency, formatDate } from "../../helpers";
import { SecretsService } from "../../secrets/secrets.service";
import { PaymentService } from "../../services/paystack";
import {State, SubscriptionPlan} from "../../types";
import { AppRepo } from "../app.repo";
import { GenericService } from "../general";

@Injectable()
export class SubscriptionService {
  constructor(
    private repo: AppRepo,
    private helper: GenericService,
    private secrets: SecretsService,
    private payment: PaymentService,
  ) { }

  handleSubscription = async ({
    phoneNumber,
    profileName,
    state,
    input,

  }: {
    phoneNumber: string;
    state: State;
    input: string;
    profileName: string;
  }) => {
    try {
      const { stage, user, data } = state;
      const parsedInput = Number(input)
      if(isNaN(parsedInput)) return this.helper.handleNoState({
        phoneNumber,
        profileName,
        state,
        customHeader: "Please select any of the plan above"
      })

      if (stage === "subscription-acceptance") {
        const { isFirstTimeSubscriber, subscriptionPlans } = data;
        if(isFirstTimeSubscriber){
          const selectedPlan = subscriptionPlans[Number(input) -1] as SubscriptionPlan;
          const paymentLink = await this.payment.initializePaystackPayment({
            email: user!.email,
            amountInNaira: Number(selectedPlan.amount),
            metaData: { phoneNumber, planPaidFor: selectedPlan, state },
            callbackUrl: this.secrets.get("PAYSTACK_WEBHOOK"),
          });
          const { data, status } = paymentLink;
          if (status) {
            const message = `Click on the link ${data.data.authorization_url} to complete your subscription for the
${selectedPlan.planName} for ${formatCurrency(Number(selectedPlan.amount))} per month.`;
            return this.helper.sendTextAndSetCache({
              phoneNumber,
              message,
              nextStage: "subscription-payment-option",
              state
            });
          }
        }
        else {
          const RENEW = 1;
          const CHARGE_NEW_CARD = 2
          const CHANGE_PLAN = 3

            if (user?.subscriptionStatus === "expired") {
              const { subscriptionPlans, subscription } = data as {subscriptionPlans: SubscriptionPlan[], subscription: SubscriptionPlan};
              if(parsedInput == RENEW) {
                const card = await this.repo.fetchUserDefaultCard(user!.id);
                const { email: cardEmail, token: authorizationCode } = card;
                const amount = Number(subscription.amount);
                const chargeAttempt = await this.payment.chargePaystackCard({
                  amount,
                  cardEmail,
                  authorizationCode
                });
                const { data } = chargeAttempt;
                if (chargeAttempt.status !== 200 || data?.data.status !== "success") {
                  return this.helper.handleNoState({
                    customHeader: "Could not complete payment, please try again with another card",
                    phoneNumber,
                    profileName,
                    state
                  })
                }
                const today = DateTime.now();
                await this.repo.createSubscription({
                  userId: user!.id,
                  subscriptionPlanId: subscription.id as unknown as string,
                  amount: amount.toString(),
                  date: new Date(),
                  email: user!.email,
                  endDate: today.plus({ month: 1 }).toJSDate(),
                  first6Digits: card.first6Digits,
                  issuer: card.issuer,
                  last4Digits: card.last4Digits,
                  processor: card.processor,
                  reference: data.reference,
                  token: card.token,
                  transactionStatus: "success",
                  type: card.type
                })
                return this.helper.handleNoState({
                  phoneNumber,
                  profileName,
                  customHeader: "Payment completed successfully 🙌, You can now continue to enjoy our service",
                  state
                });
              }
              else if(parsedInput == CHARGE_NEW_CARD) {
                const paymentLink = await this.payment.initializePaystackPayment({
                  email: user!.email,
                  amountInNaira: Number(subscription.amount),
                  metaData: { phoneNumber, planPaidFor: subscription, state },
                  callbackUrl: this.secrets.get("PAYSTACK_WEBHOOK"),
                });
                const { data, status } = paymentLink;
                if (status) {
                  const message = `Click on the link ${data.data.authorization_url} to complete your subscription for the ${subscription.planName}
of ${subscription.amount} per month.`;
                  return this.helper.sendTextAndSetCache({
                    phoneNumber,
                    message,
                    nextStage: "subscription-payment-option",
                    state
                  });
                }
              }
              else if(parsedInput == CHANGE_PLAN) {
                return this.helper.handleChangePlan({subscriptionPlans, phoneNumber, state})
              }
              else {
                return this.helper.handleNoState({phoneNumber, profileName, state})
              }
            }
              const message = "I am not sure of your request";
              return this.helper.handleUnknownRequest({ phoneNumber, message });
        }
      }
      const ACCEPT = 1;
      const DECLINE = 2;

      if (stage === "subscription-management") {
        if (parsedInput == ACCEPT) {
          const subscription = await this.repo.fetchSubscription(user!.id);

          const message = `Subscription Status\n
Dear ${user?.firstname}
Here's a quick update on your subscription:\n
Amount: ${formatCurrency(+subscription!.amount)}
Status: ${capitalizeString(subscription!.subscriptionStatus)}
${subscription?.status === "active" ? "Next billing date" : "Expires on"}: ${formatDate(subscription!.endDate)}
Billed with: ${subscription?.issuer} ****${subscription?.last4Digits}\n
If you have any questions, contact our support team.
Best regards`;
          await this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: "landing",
            state
          });
          return this.helper.handleNoState({
            phoneNumber,
            profileName: user!.firstname,
            customHeader: "Hi, how else can I be of service to you?",
            state
          })
        }
        if (parsedInput == DECLINE) {
          const message = `Please note that canceling your subscription will not affect your access to our services. You will continue to enjoy your subscription benefits until the current subscription period expires, but it won't be renewed\n
1. Accept
2, Decline`;
          return this.helper.sendTextAndSetCache({
            message,
            phoneNumber,
            nextStage: "subscription-cancel",
            state
          });
        }
        return this.helper.handleNoState({
          phoneNumber,
          profileName,
          customHeader: "Could not understand your request, Lets start this again",
          state
        });
      }

      if (stage === "subscription-cancel") {
        const subscriptionStatus = await this.repo.fetchSubscription((user!.id))
        const message = subscriptionStatus?.status !== "active" ? "Your subscription has either expired or canceled " : "We respect your decision to unsubscribe. 😢 Thank you for being a part of our community. If you ever decide to return, we'll be here. 🙌"
        if (parsedInput == ACCEPT) {
          subscriptionStatus?.status === "active" ?? await this.repo.unSubscribe(user!.id);
          return this.helper.handleNoState({
            phoneNumber,
            profileName,
            customHeader: message,
            state
          });
        }
        if (parsedInput == DECLINE) {
          return this.helper.handleNoState({ phoneNumber, profileName, state });
        }
        return this.helper.handleNoState({
          phoneNumber,
          profileName,
          customHeader: "Could not understand your request, lets start this again",
          state
        });
      }

      if (stage === "subscription-change-expired-plan") {
        const { subscriptionPlans, isFirstTimeSubscriber } = state.data
        const selectedPlan = subscriptionPlans[parsedInput - 1] as SubscriptionPlan;
        const defaultCard = await this.repo.fetchUserDefaultCard(state.user!.id);
        const message = `Subscription alert\n
Your subscription has expired 😔. To continue using our service and access all its benefits, please consider renewing your subscription.\n
*Plan: ${selectedPlan!.planName}*
*Amount Due: ${formatCurrency(Number(selectedPlan!.amount))}*\n
1. Renew with ${defaultCard!.issuer.toUpperCase()} ending in ${defaultCard!.last4Digits}
2. Pay with new card
3. Change plan
4. Decline`
        return this.helper.sendTextAndSetCache({
          message,
          phoneNumber,
          state,
          data: { isFirstTimeSubscriber, subscriptionPlans, subscription: selectedPlan },
          nextStage: "subscription-acceptance"
        })
      }
    } catch (error) {
      console.log({ error });
    }
    return {
      status: "success",
    };
  };
}

