import { CustomRes } from '@backend-template/helpers';
import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getData() {
    return CustomRes.success(await this.appService.getData());
  }
}
