import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigatewayv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class LambdaApiGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appFunction = new lambda.Function(this, 'AppFunction', {
      code: lambda.Code.fromAsset('dist/apps/api'),
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'main.handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        CACHE_DISABLED: 'true',
      },
    });

    // appFunction.grantInvoke(appApi);
  }
}
