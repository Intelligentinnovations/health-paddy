import { Injectable } from "@nestjs/common";

import { sendWhatsAppText } from "../../helpers";
import { UserRepo } from "../../repo";
import { State } from "../../types";
import { EmailSchema } from "../../utils/schema";
import { StringSchema } from "../../utils/schema/auth.schema";
import { GenericService } from "../general";

@Injectable()
export class SignupService {
  constructor(
    private userRepo: UserRepo,
    private helper: GenericService,
  ) { }


  handleSignup = async ({
    phoneNumber,
    input,
    state,
    profileName,
  }: {
    phoneNumber: string;
    input: string;
    state: State;
    profileName: string;
  }) => {
    try {
      if (state.stage === "signup/firstname") {
        StringSchema.parse(input)
        return this.helper.sendTextAndSetCache({
          message: `Great ${input}, Please enter your last name`,
          phoneNumber,
          nextStage: "signup/lastname",
          state,
          data: { ...state.data, firstname: input }
        })
      }
      if (state.stage === "signup/lastname") {
        StringSchema.parse(input)
        return this.helper.sendTextAndSetCache({
          message: `Great ${state.data.firstname} ${input}, Please tell me your email`,
          phoneNumber,
          nextStage: "signup/email",
          state,
          data: { ...state.data, lastname: input }
        })
      }
      if (state.stage === "signup/email") {
        try {
          EmailSchema.parse({ email: input })
        } catch (error) {
          console.log({ error })
          return sendWhatsAppText({ message: "Please enter a valid email", phoneNumber })
        }
        const emailExist = await this.userRepo.findUserByEmail(input);
        if (emailExist) {
          const message = "The email already exist, Please enter another email";
          return sendWhatsAppText({ message, phoneNumber })
        }
        await this.userRepo.createUser({
          email: input,
          firstname: state.data.firstname,
          lastname: state.data.lastname,
          phone: phoneNumber
        })
        return this.helper.sendTextAndSetCache({
          message: "May i know your date of birth? e.g ( 01/10/2000 )",
          phoneNumber,
          state,
          nextStage: "create-meal-plan/age",
          data: { ...state.data, email: input }
        })
      }
      return this.helper.handleNoState({
        phoneNumber,
        profileName,
        customHeader: "Could not understand your request, lets start again",
        state
      });
    }
    catch (e) {

      console.log(e);

      return {
        status: false
      }
    }

  }
}
