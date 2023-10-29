import {
  PublishBatchCommand,
  PublishCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { MessageBody } from '@backend-template/types';
import { v4 } from 'uuid';

import { Messaging } from '../messaging';

export class Sns implements Messaging {
  private sns: SNSClient;

  constructor() {
    this.sns = new SNSClient({});
  }

  async send(data: Array<MessageBody> | MessageBody): Promise<void> {
    if (Array.isArray(data)) {
      await this.sns.send(
        new PublishBatchCommand({
          PublishBatchRequestEntries: data.map((i) => ({
            Id: v4(),
            Message: JSON.stringify(i),
          })),
          TopicArn: process.env.SNS_TOPIC,
        })
      );
    } else {
      await this.sns.send(
        new PublishCommand({
          Message: JSON.stringify(data),
          TopicArn: process.env.SNS_TOPIC,
        })
      );
    }
  }
}
