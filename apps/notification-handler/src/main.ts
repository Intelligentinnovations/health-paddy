import {
  awsBootstrap,
  awsService,
  AwsTransporter,
} from '@backend-template/microservice';
import { Handler, SQSEvent } from 'aws-lambda';
import { firstValueFrom, ReplaySubject } from 'rxjs';

import { AppModule } from './app.module';

const transporterSubject = new ReplaySubject<AwsTransporter>();
awsBootstrap(AppModule).then((transporter) =>
  transporterSubject.next(transporter)
);

export const sqsHandler: Handler = async (event: SQSEvent, context) => {
  console.log('event :: ', JSON.stringify(event));

  const transporter = await firstValueFrom(transporterSubject);
  await awsService(event, context, transporter);

  return;
};
