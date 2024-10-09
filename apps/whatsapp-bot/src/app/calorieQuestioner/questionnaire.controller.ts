import {CustomRes, ZodValidationPipe} from "@backend-template/helpers";
import {
  ActivityLevelPayload,
  ActivityLevelSchema,
  BioDataPayload,
  BioDataSchema,
  CalculateCalorieSchema, GoalDurationPayload, GoalDurationSchema, HealthConditionPayload, HealthConditionSchema,
  HealthGoalPayload,
  HealthGoalSchema, TargetWeightPayload, TargetWeightSchema
} from "@backend-template/types";
import { CalculateCaloriePayload } from "@backend-template/types";
import {Body, Controller, Post, Response } from "@nestjs/common";
import {FastifyReply} from "fastify";

import {QuestionnaireService} from "./questionnaire.service";

@Controller("calorie-calculator")
export class QuestionnaireController {
  constructor(
    private readonly questionerService: QuestionnaireService) {
  }

  @Post("auth")
  async auth(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(CalculateCalorieSchema)) payload:CalculateCaloriePayload ) {   
    const data = await this.questionerService.saveUserData(payload)    
    res.status(200).send(data)
  }

  @Post("goal")
  async submitGoal(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(HealthGoalSchema)) payload:HealthGoalPayload ) {
    const data = await this.questionerService.submitGoal(payload)
    res.status(200).send(data)
  }

  @Post("bio-data")
  async submitBioData(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(BioDataSchema)) payload:BioDataPayload ) {
    const data = await this.questionerService.submitBioData(payload)
    res.status(200).send(data)
  }

  @Post("target-weight")
  async submitTargetWeight(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(TargetWeightSchema)) payload:TargetWeightPayload ) {
    const data = await this.questionerService.submitTargetWeight(payload)
    res.status(200).send(data)
  }

  @Post("goal-duration")
  async submitGoalDuration(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(GoalDurationSchema)) payload:GoalDurationPayload ) {
    const data = await this.questionerService.submitGoalDuration(payload)
    res.status(200).send(data)
  }

  @Post("activity-level")
  async submitActivityLevel(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(ActivityLevelSchema)) payload:ActivityLevelPayload ) {
    const data = await this.questionerService.submitActivityLevel(payload)
    res.status(200).send(data)
  }

  @Post("health-condition")
  async submitHealthCondition(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(HealthConditionSchema)) payload:HealthConditionPayload ) {
    const data = await this.questionerService.submitHealthCondition(payload)
    res.status(200).send(data)
  }
}
