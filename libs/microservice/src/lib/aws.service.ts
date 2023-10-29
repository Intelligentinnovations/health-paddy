import { Context, S3Event, SNSEvent, SQSEvent } from 'aws-lambda';

import { AwsTransporter } from './aws.transporter';

export async function awsService(
  event: SQSEvent | SNSEvent | S3Event,
  context: Context,
  transporter: AwsTransporter
) {
  for (const record of event.Records) {
    if ('Sns' in record) {
      const message = JSON.parse(record.Sns.Message);
      const handler = transporter.getHandlerByPattern(message.pattern);
      await handler?.(message.data, context);
    } else if ('s3' in record) {
      const handler = transporter.getHandlerByPattern(record.eventName);
      await handler?.(record.s3.object, context);
    } else {
      const message = JSON.parse(record.body);
      const handler = transporter.getHandlerByPattern(message.pattern);
      await handler?.(message.data, context);
    }
  }
}
