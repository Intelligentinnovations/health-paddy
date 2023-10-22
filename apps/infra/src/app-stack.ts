import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as pipe from 'aws-cdk-lib/aws-pipes';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, 'AppTopic');

    const appQueue = new sqs.Queue(this, 'AppQueue', {});

    const pipeRole = new iam.Role(this, 'PipeRole', {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
    });

    topic.grantPublish(pipeRole);
    appQueue.grantConsumeMessages(pipeRole);

    new pipe.CfnPipe(this, 'AppQueueTopicPipe', {
      target: topic.topicArn,
      source: appQueue.queueArn,
      roleArn: pipeRole.roleArn,
      targetParameters: {
        inputTemplate: '{"action": <$.body.action>, "body": <$.body.body>}',
      },
    });

    new cdk.CfnOutput(this, 'TopicArn', {
      exportName: 'TopicArn',
      value: topic.topicArn,
    });

    new cdk.CfnOutput(this, 'QueueUrl', {
      exportName: 'QueueUrl',
      value: appQueue.queueUrl,
    });
  }
}
