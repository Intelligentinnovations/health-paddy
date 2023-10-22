import type { ScheduleType } from '@backend-template/types';
import serverless from '@vendia/serverless-express';

import type { AppHandlerTypes, LambdaEvent } from '../utils';
import { Res } from '../utils';

export async function appHandler(
  event: LambdaEvent,
  handlers: AppHandlerTypes
) {
  console.log('event: ', JSON.stringify(event));

  if ('Records' in event) {
    try {
      for (const record of event.Records) {
        if ('eventSource' in record) {
          if (record.eventSource === 'aws:sqs')
            await handlers.eventHandler?.(JSON.parse(record.body));
        } else if (record.EventSource === 'aws:sns') {
          await handlers.eventHandler?.(JSON.parse(record.Sns.Message));
        }
      }
    } catch (e) {
      console.error(`error handling event :: `, e);
    }

    return Res.success();
  } else if ('scheduleType' in event) {
    return handlers.scheduleHandler?.(event.scheduleType as ScheduleType);
  } else if ('headers' in event) {
    return handlers.app
      ? serverless({ app: handlers.app })(event)
      : Res.failed('no handler for this event');
  } else {
    return Res.failed('no handler for this event');
  }
}
