import { KyselyService } from '@backend-template/database';
import { Optional } from '@backend-template/helpers';
import { Injectable } from '@nestjs/common';

import { DB } from '../utils/types';

@Injectable()
export class AppRepo {
  constructor(private client: KyselyService<DB>) {}

  findAll() {
    return Optional.of(this.client.selectFrom('Todo').selectAll().execute());
  }
}
