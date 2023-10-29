import { Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

import { CustomRes } from './custom-res';

@Catch(CustomRes)
export class CustomResFilter implements ExceptionFilter {
  catch(exception: CustomRes) {
    if (exception.getStatus() >= 500) {
      Logger.error(exception.stack);
    }

    throw new HttpException(exception.getData(), exception.getStatus());
  }
}
