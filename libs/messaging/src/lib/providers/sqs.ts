import {
  SendMessageBatchCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { MessageBody } from '@backend-template/types';
import { v4 } from 'uuid';

import { Messaging } from '../messaging';

let sqsClient: SQSClient;

export class Sqs implements Messaging {
  readonly #queueUrl: string | undefined;

  constructor(queueUrl = process.env.QUEUE_URL) {
    if (!sqsClient)
      sqsClient = new SQSClient({
        region: process.env.AWS_REGION,
      });

    this.#queueUrl = queueUrl;
  }

  async send(data: Array<MessageBody> | MessageBody): Promise<void> {
    if (Array.isArray(data)) {
      await sqsClient.send(
        new SendMessageBatchCommand({
          Entries: data.map((i) => ({
            Id: v4(),
            MessageBody: JSON.stringify(i),
          })),
          QueueUrl: this.#queueUrl,
        })
      );
    } else {
      await sqsClient.send(
        new SendMessageCommand({
          MessageBody: JSON.stringify(data),
          QueueUrl: this.#queueUrl,
        })
      );
    }
  }
}
