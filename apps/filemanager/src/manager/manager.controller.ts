import { CustomRes, ZodValidationPipe } from '@backend-template/helpers';
import { FileManagerData, FileManagerSchema } from '@backend-template/types';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';

import { ManagerService } from './manager.service';

@Controller()
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(FileManagerSchema))
  async getData(@Body() data: FileManagerData) {
    switch (data.action) {
      case 'upload':
        return CustomRes.success(await this.managerService.uploadFile(data));
      case 'generateSignedUrl':
        return CustomRes.success(
          this.managerService.generateSignedUrl(data.url)
        );
      case 'generateSignedCookie':
        return CustomRes.success(
          this.managerService.generateSignedCookie(data.url)
        );
      default:
        return CustomRes.failed('no handler for event');
    }
  }
}
