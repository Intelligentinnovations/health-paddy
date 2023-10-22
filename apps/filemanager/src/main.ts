import { HttpEvent, Res, S3EventBody } from '@backend-template/server';

import { eventHandler, httpHandler } from './handlers';
import { getSecrets } from './secrets';

export async function handler(event: HttpEvent | { Records: S3EventBody[] }) {
  await getSecrets();
  console.log('event: ', JSON.stringify(event));

  try {
    if ('Records' in event) {
      const responses: Array<Promise<unknown>> = [];
      for (const i in event.Records) {
        responses.push(
          eventHandler(event.Records[i]?.eventName, event.Records[i]?.s3.object)
        );
      }

      await Promise.allSettled(responses);
      return Res.success();
    } else if ('body' in event) {
      return httpHandler(event);
    }

    return Res.failed('no handler for this event');
  } catch (e: unknown) {
    console.error(`http error :: `, e);
    if (e instanceof Res) return e;
    else return Res.serverError();
  }
}
