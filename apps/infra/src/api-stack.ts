import * as gateway from '@aws-cdk/aws-apigatewayv2-alpha';
import * as gatewayAuthorizer from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as gatewayIntegration from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import process from 'process';

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

    const authFunctionArn = ssm.StringParameter.valueForStringParameter(
      this,
      `/${appName}/${Constants.AuthFunctionArn}`
    );

    const userPoolId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${appName}/${Constants.UserPoolId}`
    );

    const userPoolClientId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${appName}/${Constants.UserPoolClientId}`
    );

    /******************************************/

    /**
     * Api config
     * */

    const appApi = new gateway.HttpApi(this, `${appName}-Api`, {});

    const authorizer = new gatewayAuthorizer.HttpJwtAuthorizer(
      `${appName}-CognitoAuthorizer`,
      `https://cognito-idp.${process.env.CDK_DEFAULT_REGION}.amazonaws.com/${userPoolId}`,
      {
        identitySource: ['$request.header.Authorization'],
        jwtAudience: [userPoolClientId],
      }
    );

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

    /*************************/

    /**
     * Auth config
     * */

    const authFunction = lambda.Function.fromFunctionArn(
      this,
      'AuthFunction',
      authFunctionArn
    );

    const authIntegration = new gatewayIntegration.HttpLambdaIntegration(
      'AuthIntegration',
      authFunction
    );

    appApi.addRoutes({ integration: authIntegration, path: '/auth/{proxy+}' });
    appApi.addRoutes({
      integration: authIntegration,
      path: '/auth/change-password',
      methods: [gateway.HttpMethod.POST],
      authorizer,
    });
    /*******************************/

    new cdk.CfnOutput(this, 'Url', { value: appApi.apiEndpoint });
  }
}
