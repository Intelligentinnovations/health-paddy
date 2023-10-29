import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DynamoService extends DynamoDBDocument {
  constructor(region?: string) {
    super(DynamoDBDocument.from(new DynamoDBClient({ region })));
  }
}
