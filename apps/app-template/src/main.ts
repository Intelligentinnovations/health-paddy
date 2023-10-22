import { LambdaEvent, Res, server } from '@backend-template/server';
import { ScheduleType } from '@backend-template/types';
import serverless from '@vendia/serverless-express';

import { eventHandler, scheduleHandler } from './handlers';
import router from './routes';
import { getSecrets, secrets } from './secrets';
import { security } from './security';

export async function handler(event: LambdaEvent) {
  await getSecrets();
  console.log('event: ', JSON.stringify(event));

  if ('Records' in event) {
    try {
      for (const record of event.Records) {
        if ('eventSource' in record) {
          if (record.eventSource === 'aws:sqs')
            await eventHandler(JSON.parse(record.body));
        } else if (record.EventSource === 'aws:sns') {
          await eventHandler(JSON.parse(record.Sns.Message));
        }
      }
    } catch (e) {
      console.error(`error handling event :: `, e);
    }

    return Res.success();
  } else if ('scheduleType' in event) {
    return scheduleHandler(event.scheduleType as ScheduleType);
  } else if ('headers' in event) {
    return serverless({ app: server(router, security, secrets.BASE_ROUTE) })(
      event
    );
  } else {
    return Res.failed('no handler for this event');
  }
}
