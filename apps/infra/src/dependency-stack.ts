import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

import { layerVersionParam, secrets } from './secrets';

export class DependencyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appName = `${secrets.APP_NAME}-${secrets.ENV}`;

    const dependencyLayer = new lambda.LayerVersion(this, 'DependencyLayer', {
      code: lambda.Code.fromAsset('dist/dependency'),
      removalPolicy: RemovalPolicy.RETAIN,
    });

    new ssm.StringParameter(this, 'DependencyLayerVersion', {
      stringValue: dependencyLayer.layerVersionArn,
      parameterName: `/${appName}/${layerVersionParam}`,
    });
  }
}
