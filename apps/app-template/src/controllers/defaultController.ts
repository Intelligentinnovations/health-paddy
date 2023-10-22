import { Controller, Res } from '@backend-template/server';
import { UploadFileSchema } from '@backend-template/types';
import { Request } from 'express';

import { DefaultService } from '../services';
import { DefaultServiceImpl } from '../services/impl';

export class DefaultController extends Controller {
  readonly #defaultService: DefaultService;

  constructor(defaultService: DefaultService = new DefaultServiceImpl()) {
    super();
    this.#defaultService = defaultService;
  }

  async default(req: Request) {
    const data = this.validate({ schema: UploadFileSchema }, req.body);

    const us = this.user(req).unwrapOrNull();
    const pagination = this.pagination(req);

    const user = await this.#defaultService.getUser(pagination, us);
    return Res.success();
  }
}
