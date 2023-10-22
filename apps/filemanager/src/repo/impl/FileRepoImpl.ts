import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { getDynamoDbClient } from '@backend-template/database';
import { Optional } from '@backend-template/server';
import { getPromiseAttribute } from '@backend-template/utils';

import { secrets } from '../../secrets';
import { FileData } from '../../utils';
import { FileRepo } from '../fileRepo';

export class FileRepoImpl implements FileRepo {
  readonly #client: DynamoDBDocument;

  constructor(client: DynamoDBDocument = getDynamoDbClient()) {
    this.#client = client;
  }

  async createFile(data: FileData): Promise<void> {
    await this.#client.put({
      TableName: secrets.TABLE_NAME,
      Item: data,
    });
  }

  fetchFile(key: string): Optional<FileData> {
    return Optional.of(
      getPromiseAttribute(
        this.#client.get({ TableName: secrets.TABLE_NAME, Key: { key } }),
        'Item'
      ) as Promise<FileData>
    );
  }

  async updateFile(data: FileData): Promise<void> {
    await this.#client.update({
      TableName: secrets.TABLE_NAME,
      Key: { key: data.key },
      AttributeUpdates: {
        state: { Value: data.state },
      },
    });
  }
}
