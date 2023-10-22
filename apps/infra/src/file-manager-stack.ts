import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamoDb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Notification from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class FileManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const storageBucket = new s3.Bucket(this, 'FilesStorage');

    const filesTable = new dynamoDb.TableV2(this, 'FilesTable', {
      partitionKey: { name: 'key', type: dynamoDb.AttributeType.STRING },
    });

    const publicKey = new cloudfront.PublicKey(this, 'PublicKey', {
      encodedKey: Buffer.from(
        process.env.CLOUDFRONT_PUBLIC_KEY ?? '',
        'base64'
      ).toString(),
    });

    const keyGroup = new cloudfront.KeyGroup(this, 'KeyGroup', {
      items: [publicKey],
    });

    const storageOrigin = new origin.S3Origin(storageBucket);

    const distribution = new cloudfront.Distribution(
      this,
      'FilesDistribution',
      {
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          origin: storageOrigin,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          trustedKeyGroups: [keyGroup],
        },
        additionalBehaviors: {
          'uploads/public/*': {
            origin: storageOrigin,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          },
        },
      }
    );

    const uploaderFunction = new lambda.Function(
      this,
      'FilesUploaderFunction',
      {
        code: lambda.Code.fromAsset('dist/apps/filemanager'),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'main.handler',
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          BUCKET_NAME: storageBucket.bucketName,
          TABLE_NAME: filesTable.tableName,
          CLOUDFRONT_PRIVATE_KEY: process.env.CLOUDFRONT_PRIVATE_KEY ?? '',
          CLOUDFRONT_KEYPAIR_ID: publicKey.publicKeyId,
          CACHE_DISABLED: 'true',
          DOMAIN: distribution.domainName,
          BASE_ROUTE: 'filemanager',
        },
      }
    );

    storageBucket.grantPut(uploaderFunction);
    storageBucket.grantRead(uploaderFunction);
    filesTable.grantFullAccess(uploaderFunction);

    storageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3Notification.LambdaDestination(uploaderFunction),
      { prefix: 'uploads/' }
    );

    const uploaderUrl = uploaderFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    new cdk.CfnOutput(this, 'FileUploaderUrl', { value: uploaderUrl.url });
    new cdk.CfnOutput(this, 'FileUploaderFunction', {
      value: uploaderFunction.functionArn,
      exportName: 'FileUploaderFunctionArn',
    });
  }
}
