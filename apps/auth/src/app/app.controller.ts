import { Token } from '@backend-template/authorizer';
import { CustomRes, ZodValidationPipe } from '@backend-template/helpers';
import { Body, Controller, Post, Query, UsePipes } from '@nestjs/common';
import { z } from 'zod';

import {
  AuthenticateData,
  AuthenticateSchema,
  ChangePasswordData,
  ChangePasswordSchema,
  ConfirmAccountData,
  ConfirmAccountSchema,
  ResetPasswordData,
  ResetPasswordSchema,
} from '../utils/schema';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('register')
  @UsePipes(new ZodValidationPipe(AuthenticateSchema))
  async register(@Body() data: AuthenticateData) {
    await this.appService.signup(data);
    return CustomRes.success();
  }

  @Post('confirm')
  @UsePipes(new ZodValidationPipe(ConfirmAccountSchema))
  async confirm(@Body() data: ConfirmAccountData) {
    await this.appService.confirmEmail(data);
    return CustomRes.success();
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(AuthenticateSchema)) data: AuthenticateData
  ) {
    return CustomRes.success(await this.appService.login(data));
  }

  @Post('forgot-password')
  async forgotPassword(
    @Query('email', new ZodValidationPipe(z.string().min(1).email()))
    email: string
  ) {
    return CustomRes.success(await this.appService.forgotPassword(email));
  }

  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() data: ResetPasswordData) {
    return CustomRes.success(await this.appService.resetPassword(data));
  }

  @Post('change-password')
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordSchema)) data: ChangePasswordData,
    @Token() token: string
  ) {
    return CustomRes.success(await this.appService.changePassword(token, data));
  }
}
