import {Body, Controller, Post, Response } from "@nestjs/common";
import {CustomRes, ZodValidationPipe} from "@backend-template/helpers";
import {CalculateCalorieSchema} from "@backend-template/types";
import {FastifyReply} from "fastify";
import {QuestionerService} from "./questioner.service";
import {CalculateCaloriePayload} from "../../../../../libs/types/src/lib/schema/calculateCalorieCount";

@Controller('calorie-calculator')
export class QuestionerController {
  constructor(
    private readonly questionerService: QuestionerService) {
  }

  @Post("bio-data")
  async calorieNeed(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(CalculateCalorieSchema)) payload:CalculateCaloriePayload ) {
    const data = await this.questionerService.saveUserData(payload)
    return CustomRes.success(data);
  }

  async submitResponse(
    @Response() res: FastifyReply,
    @Body(new ZodValidationPipe(CalculateCalorieSchema)) payload:CalculateCaloriePayload ) {
    const data = await this.questionerService.processResponse(payload)
    return CustomRes.success(data);
  }
}
