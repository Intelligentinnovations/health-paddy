import {
  awsBootstrap,
  awsService,
  AwsTransporter,
} from '@backend-template/microservice';
import { httpBootstrap } from '@backend-template/server';
import awsLambdaFastify, { CallbackHandler } from '@fastify/aws-lambda';
import { APIGatewayProxyEvent, Handler, SNSEvent, SQSEvent } from 'aws-lambda';
import { firstValueFrom, ReplaySubject } from 'rxjs';

import { AppModule } from './app.module';

const microserviceSubject = new ReplaySubject<AwsTransporter>();
awsBootstrap(AppModule).then((transporter) =>
  microserviceSubject.next(transporter)
);

const serverSubject = new ReplaySubject<CallbackHandler>();
httpBootstrap(AppModule, '').then((transporter) => {
  serverSubject.next(
    awsLambdaFastify(transporter.getHttpAdapter().getInstance())
  );
});

export const handler: Handler = async (
  event: APIGatewayProxyEvent | SQSEvent | SNSEvent,
  context,
  callback
) => {
  console.log('event :: ', JSON.stringify(event));

  if ('requestContext' in event) {
    const server = await firstValueFrom(serverSubject);
    return server(event, context, callback);
  } else {
    const transporter = await firstValueFrom(microserviceSubject);
    await awsService(event, context, transporter);
  }
};
