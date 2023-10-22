#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config.js';

import * as cdk from 'aws-cdk-lib';
import * as process from 'process';

import { AppStack } from './app-stack';
import { FileManagerStack } from './file-manager-stack';
import { LambdaApiGatewayStack } from './lambda-api-gateway-stack';
import { NotificationStack } from './notification-stack';

const app = new cdk.App();
const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

new AppStack(app, 'AppStack', {
  stackName: `bkt-app-${process.env.ENV}`,
  env,
});

new LambdaApiGatewayStack(app, 'InfraStack', {
  stackName: `bkt-api-${process.env.ENV}`,
  env,
});

new FileManagerStack(app, 'FilemanagerStack', {
  stackName: `bkt-file-${process.env.ENV}`,
  env,
});

new NotificationStack(app, 'NotificationStack', {
  stackName: `bkt-notification-${process.env.ENV}`,
  env,
});
