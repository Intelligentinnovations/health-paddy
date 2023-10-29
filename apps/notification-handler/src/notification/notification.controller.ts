import { CustomRes } from '@backend-template/helpers';
import { NotificationData } from '@backend-template/types';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private service: NotificationService) {}

  @MessagePattern('NOTIFICATION')
  async sendNotification(@Payload() data: NotificationData) {
    await this.service.send(data);
    return CustomRes.success();
  }
}
