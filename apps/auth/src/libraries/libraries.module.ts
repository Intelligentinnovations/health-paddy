import { CognitoService } from '@backend-template/authorizer';
import { Global, Module } from '@nestjs/common';

import { SecretsModule } from '../secrets/secrets.module';
import { SecretsService } from '../secrets/secrets.service';
import { HelperService } from './helper.service';

@Global()
@Module({
  imports: [SecretsModule],
  providers: [
    HelperService,
    {
      provide: CognitoService,
      useFactory: (secrets: SecretsService) => {
        return new CognitoService(secrets.get('AWS_REGION'));
      },
      inject: [SecretsService],
    },
  ],
  exports: [CognitoService, HelperService],
})
export class LibrariesModule {}
