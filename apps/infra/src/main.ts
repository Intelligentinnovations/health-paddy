#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config.js';

import * as cdk from 'aws-cdk-lib';
import * as process from 'process';

import { AppStack } from './app-stack';
import { FileManagerStack } from './file-manager-stack';
import { NotificationStack } from './notification-stack';
import { getSecrets, secrets } from './secrets';

getSecrets().then(() => {
  const app = new cdk.App();
  const env: cdk.Environment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  };

  new AppStack(app, 'AppStack', {
    stackName: `${secrets.APP_NAME}-app-${secrets.ENV}`,
    env,
  });

  // new LambdaApiGatewayStack(app, 'ApiStack', {
  //   stackName: `${secrets.APP_NAME}-api-${secrets.ENV}`,
  //   env,
  // });

  new FileManagerStack(app, 'FileManagerStack', {
    stackName: `${secrets.APP_NAME}-file-${secrets.ENV}`,
    env,
  });

  new NotificationStack(app, 'NotificationStack', {
    stackName: `${secrets.APP_NAME}-notification-${secrets.ENV}`,
    env,
  });
});
