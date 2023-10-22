import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

let dynamoDbClient: DynamoDBDocument;

export function getDynamoDbClient() {
  if (!dynamoDbClient) {
    dynamoDbClient = DynamoDBDocument.from(
      new DynamoDBClient({ region: process.env.AWS_REGION })
    );
  }

  return dynamoDbClient;
}
