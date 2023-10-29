import {
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { MessageBody } from '@backend-template/types';
import { v4 } from 'uuid';

import { Messaging } from '../messaging';

export class Sqs implements Messaging {
  private readonly sqsClient: SQSClient;

  constructor() {
    this.sqsClient = new SQSClient({ region: process.env.AWS_REGION });
  }

  async send(
    data: Array<MessageBody> | MessageBody,
    queueUrl = process.env.QUEUE_URL
  ): Promise<void> {
    if (Array.isArray(data)) {
      await this.sqsClient.send(
        new SendMessageBatchCommand({
          Entries: data.map((i) => ({
            Id: v4(),
            MessageBody: JSON.stringify(i),
          })),
          QueueUrl: queueUrl,
        })
      );
    } else {
      await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: JSON.stringify(data),
          QueueUrl: queueUrl,
        })
      );
    }
  }
}
