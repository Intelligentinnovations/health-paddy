import { CustomResFilter } from '@backend-template/helpers';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';

import { AwsTransporter } from './aws.transporter';

export async function awsBootstrap(module: unknown) {
  const strategy = new AwsTransporter();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    module,
    { strategy }
  );

  app.useGlobalFilters(new CustomResFilter());
  await app.init();

  Logger.log(`🚀 Application is running`);

  return strategy;
}
