import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';

import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class HelperService {
  constructor(private secrets: SecretsService) {}

  createHash(username: string) {
    return createHmac('sha256', this.secrets.get('USER_POOL_CLIENT_SECRET'))
      .update(`${username}${this.secrets.get('USER_POOL_CLIENT_ID')}`)
      .digest('base64');
  }
}
