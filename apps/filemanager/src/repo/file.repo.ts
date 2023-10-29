import { DynamoService } from '@backend-template/database';
import { Optional } from '@backend-template/helpers';
import { getPromiseAttribute } from '@backend-template/utils';
import { Injectable } from '@nestjs/common';

import { SecretsService } from '../secrets/secrets.service';
import { FileData } from '../utils/types';

@Injectable()
export class FileRepo {
  constructor(private client: DynamoService, private secrets: SecretsService) {}

  async createFile(data: FileData): Promise<void> {
    await this.client.put({
      TableName: this.secrets.get('TABLE_NAME'),
      Item: data,
    });
  }

  fetchFile(key: string): Optional<FileData> {
    return Optional.of(
      getPromiseAttribute(
        this.client.get({
          TableName: this.secrets.get('TABLE_NAME'),
          Key: { key },
        }),
        'Item'
      ) as Promise<FileData>
    );
  }

  async updateFile(data: FileData): Promise<void> {
    await this.client.update({
      TableName: this.secrets.get('TABLE_NAME'),
      Key: { key: data.key },
      AttributeUpdates: {
        state: { Value: data.state },
      },
    });
  }
}
