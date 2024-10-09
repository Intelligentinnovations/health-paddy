import { CustomResFilter } from "@backend-template/helpers";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";


export async function httpBootstrap(module: unknown, globalPrefix: string) {
  const app = await NestFactory.create<NestFastifyApplication>(
    module,
    new FastifyAdapter()
  );

  app.setGlobalPrefix(globalPrefix);

  app.useGlobalFilters(new CustomResFilter());


  await app.init();

  Logger.log(`🚀 Application is running on: http://localhost/${globalPrefix}`);

  return app;
}
