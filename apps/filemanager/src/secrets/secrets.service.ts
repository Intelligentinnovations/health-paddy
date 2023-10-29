import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { objectSchema } from './secrets.schema';

@Injectable()
export class SecretsService {
  constructor(private secrets: z.infer<typeof objectSchema>) {}

  get<T extends keyof typeof this.secrets>(key: T) {
    return this.secrets[key];
  }
}
