import * as gateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as gatewayIntegration from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { Constants } from './constants';
import { secrets } from './secrets';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = `${secrets.APP_NAME}-${secrets.ENV}`;

    /**
     * Get parameters from SSM.
     * */

    const appFunctionArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${appName}/${Constants.AppFunctionArn}`
    );


    /******************************************/

    /**
     * Api config
     * */

    const appApi = new gateway.HttpApi(this, `${appName}-Api`, {});


    /******************************/

    /**
     * Applications config
     * */

    const appFunction = lambda.Function.fromFunctionArn(
      this,
      'AppFunction',
      appFunctionArn
    );

    const appIntegration = new gatewayIntegration.HttpLambdaIntegration(
      'AppIntegration',
      appFunction
    );

    appApi.addRoutes({ integration: appIntegration, path: '/v1/{proxy+}' });



    new cdk.CfnOutput(this, 'Url', { value: appApi.apiEndpoint });
  }
}
