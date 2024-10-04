import {Body, Controller, Post, Response } from "@nestjs/common";
import {CustomRes, ZodValidationPipe} from "@backend-template/helpers";
import {
  BioDataPayload,
  BioDataSchema,
  CalculateCalorieSchema,
  HealthGoalPayload,
  HealthGoalSchema, TargetWeightPayload, TargetWeightSchema
} from "@backend-template/types";
import {FastifyReply} from "fastify";
import {QuestionnaireService} from "./questionnaire.service";
import {CalculateCaloriePayload} from "../../../../../libs/types/src/lib/schema/calculateCalorieCount";

@Controller('calorie-calculator')
export class QuestionnaireController {
  constructor(
    private readonly questionerService: QuestionnaireService) {
  }

  @Post("auth")
  async calorieNeed(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(CalculateCalorieSchema)) payload:CalculateCaloriePayload ) {
    const data = await this.questionerService.saveUserData(payload)
    return CustomRes.success(data);
  }

  @Post('goal')
  async submitGoal(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(HealthGoalSchema)) payload:HealthGoalPayload ) {
    const data = await this.questionerService.submitGoal(payload)
    return CustomRes.success(data);
  }

  @Post('bio-data')
  async submitBioData(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(BioDataSchema)) payload:BioDataPayload ) {
    const data = await this.questionerService.submitBioData(payload)
    return CustomRes.success(data);
  }

  @Post('target-weight')
  async submitTargetWeight(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(TargetWeightSchema)) payload:TargetWeightPayload ) {
    const data = await this.questionerService.submitTargetWeight(payload)
    return CustomRes.success(data);
  }
}
