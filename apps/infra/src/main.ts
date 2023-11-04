#!/usr/bin/env node
import 'source-map-support/register';
import 'dotenv/config.js';

import * as cdk from 'aws-cdk-lib';
import * as process from 'process';

import { ApiStack } from './api-stack';
import { AppStack } from './app-stack';
import { AuthStack } from './auth-stack';
import { DependencyStack } from './dependency-stack';
import { FileManagerStack } from './file-manager-stack';
import { NotificationStack } from './notification-stack';
import { getSecrets, secrets } from './secrets';

getSecrets().then(() => {
  const appName = `${secrets.APP_NAME}-${secrets.ENV}`;
  const app = new cdk.App();
  const env: cdk.Environment = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  };

  new DependencyStack(app, 'dependency', {
    stackName: `${appName}-dependency`,
    env,
  });

  new AuthStack(app, 'auth', {
    stackName: `${appName}-auth`,
    env,
  });

  new AppStack(app, 'app', {
    stackName: `${appName}-app`,
    env,
  });

  new ApiStack(app, 'api', {
    stackName: `${appName}-api`,
    env,
  });

  new FileManagerStack(app, 'filemanager', {
    stackName: `${appName}-file`,
    env,
  });

  new NotificationStack(app, 'notification', {
    stackName: `${appName}-notification`,
    env,
  });
});
