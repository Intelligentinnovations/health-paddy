import { loadSecrets } from '@backend-template/secrets';
import { Global, Module } from '@nestjs/common';

import { schema } from './secrets.schema';
import { SecretsService } from './secrets.service';

@Global()
@Module({
  providers: [
    {
      provide: SecretsService,
      useFactory: async () => {
        const secrets = await loadSecrets(schema, []);
        return new SecretsService(secrets);
      },
    },
  ],
  exports: [SecretsService],
})
export class SecretsModule {}
