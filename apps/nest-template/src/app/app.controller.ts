import { Authenticated, Token } from '@backend-template/authorizer';
import { CustomRes } from '@backend-template/helpers';
import { UserData } from '@backend-template/types';
import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async getData() {
    return CustomRes.success(await this.appService.getData());
  }

  @Get('user')
  getUser(@Authenticated() user: UserData, @Token() token: string) {
    return CustomRes.success({ user, token });
  }
}
