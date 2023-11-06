import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { Constants } from './constants';
import { layerVersionParam, secrets } from './secrets';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
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

    const topic = new sns.Topic(this, 'AppTopic');

    const appFunction = new lambda.Function(this, 'AppFunction', {
      code: lambda.Code.fromAsset('dist/apps/nest-template'),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      layers: [dependencyLayer],
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
    });

    appFunction.grantInvoke(
      new iam.ServicePrincipal('apigateway.amazonaws.com')
    );

    new ssm.StringParameter(this, 'TopicArn', {
      stringValue: topic.topicArn,
      parameterName: `/${appName}/TopicArn`,
    });

    new ssm.StringParameter(this, 'AppFunctionArn', {
      stringValue: appFunction.functionArn,
      parameterName: `/${appName}/${Constants.AppFunctionArn}`,
    });
  }
}
