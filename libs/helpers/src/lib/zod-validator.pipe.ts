import { Logger, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';

import { CustomRes } from './custom-res';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    const res = this.schema.safeParse(value);
    if (res.success) return res.data;

    Logger.log(res.error.errors);
    throw CustomRes.badRequest(
      res.error.errors
        .map((error) => `${error.path}: ${error.message}`)
        .join('; ')
    );
  }
}
