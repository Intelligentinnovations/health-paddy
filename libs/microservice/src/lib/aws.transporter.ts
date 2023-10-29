import { Logger } from '@nestjs/common';
import { CustomTransportStrategy, Server } from '@nestjs/microservices';

export class AwsTransporter extends Server implements CustomTransportStrategy {
  listen(callback: (...optionalParams: unknown[]) => unknown) {
    Logger.log('custom aws transporter listening');
    callback();
  }

  close() {
    Logger.log('custom aws transporter closed');
  }
}
