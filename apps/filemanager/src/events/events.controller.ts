import { CustomRes } from '@backend-template/helpers';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @MessagePattern('ObjectCreated:Put')
  async fileUploaded(@Payload('key') key: string) {
    await this.eventsService.fileUploaded(key);
    return CustomRes.success();
  }
}
