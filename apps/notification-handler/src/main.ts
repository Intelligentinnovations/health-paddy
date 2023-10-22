import { Res, SNSEventBody } from '@backend-template/server';

import { eventHandler } from './handlers';
import { getSecrets } from './secrets';

export async function handler(event: { Records: SNSEventBody[] }) {
  await getSecrets();
  for (const record of event.Records) {
    await eventHandler(JSON.parse(record.Sns.Message));
  }

  return Res.success();
}
