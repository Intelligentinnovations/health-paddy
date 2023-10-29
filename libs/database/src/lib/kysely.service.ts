import { Injectable } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

@Injectable()
export class KyselyService<T> extends Kysely<T> {
  constructor(databaseUrl: string) {
    super({
      dialect: new PostgresDialect({
        pool: new Pool({ connectionString: databaseUrl }),
      }),
    });
  }
}
