import { SES } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';

import { SecretsService } from '../secrets/secrets.service';

@Injectable()
export class SesService extends SES {
  constructor(secrets: SecretsService) {
    super({
      region: secrets.get('AWS_REGION'),
    });
  }
}
