import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { layerVersionParam, secrets } from './secrets';

export class NotificationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = `${secrets.APP_NAME}-${secrets.ENV}`;

    const dependencyLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'DependencyLayer',
      ssm.StringParameter.valueForStringParameter(
        this,
        `/${appName}/${layerVersionParam}`
      )
    );

    const handler = new lambda.Function(this, 'NotificationHandler', {
      handler: 'main.sqsHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('dist/apps/notification-handler'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      layers: [dependencyLayer],
      environment: {
        MAIL_FROM: secrets.MAIL_FROM,
      },
    });

    handler.role?.attachInlinePolicy(
      new iam.Policy(this, 'SendMailPolicy', {
        statements: [
          new iam.PolicyStatement({
            actions: ['ses:SendEmail'],
            resources: ['*'],
          }),
        ],
      })
    );

    const topicArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${appName}/TopicArn`
    );

    const topic = sns.Topic.fromTopicArn(this, 'AppTopic', topicArn);
    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {});

    const notificationSubscription = new snsSubscriptions.SqsSubscription(
      notificationQueue,
      {
        filterPolicyWithMessageBody: {
          pattern: sns.FilterOrPolicy.filter(
            sns.SubscriptionFilter.stringFilter({ allowlist: ['NOTIFICATION'] })
          ),
        },
        rawMessageDelivery: true,
      }
    );

    const handlerQueueSource = new lambdaEventSource.SqsEventSource(
      notificationQueue
    );

    handler.addEventSource(handlerQueueSource);
    topic.addSubscription(notificationSubscription);
  }
}
