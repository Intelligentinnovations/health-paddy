import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { objectSchema, schema } from './secrets.schema';

@Injectable()
export class SecretsService {
  constructor(private secrets: z.infer<typeof objectSchema>) {}

  get<T extends keyof typeof schema, TR extends z.infer<typeof schema[T]>>(
    key: keyof typeof schema
  ): TR {
    return this.secrets[key] as TR;
  }
}
