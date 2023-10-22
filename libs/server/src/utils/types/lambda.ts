import { HTTPMethod } from './controller';

export type LambdaEvent = { Records: LambdaEventRecord[] } | HttpEvent;

export interface HttpEvent {
  routeKey: string;
  body: string;
  isBase64Encoded: boolean;
  headers: Record<string, string>;
  requestContext: GatewayRequestContext;
}

export type LambdaEventRecord = S3EventBody | SQSEventBody | SNSEventBody;

export type SNSEventBody = {
  EventSource: 'aws:sns';
  Sns: { Message: string };
};

export interface GatewayRequestContext {
  http: GatewayHttpData;
  stage: string;
}

export interface GatewayHttpData {
  method: HTTPMethod;
  path: string;
}

export interface SQSEventBody {
  eventSource: 'aws:sqs';
  messageId: string;
  body: string;
}

export interface S3EventBody {
  eventSource: 'aws:s3';
  eventName: 'ObjectCreated:Put';
  s3: {
    object: S3EventObject;
    bucket: { name: string };
  };
}

export type S3EventType = S3EventBody['eventName'];

export type S3EventObject = {
  key: string;
  size: number;
  eTag: string;
  sequencer: string;
};
