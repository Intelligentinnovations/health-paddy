import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

import { secrets } from './secrets';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, 'AppTopic');

    new cdk.CfnOutput(this, 'TopicArn', {
      exportName: `${secrets.APP_NAME}-app-${secrets.ENV}-TopicArn`,
      value: topic.topicArn,
    });
  }
}
