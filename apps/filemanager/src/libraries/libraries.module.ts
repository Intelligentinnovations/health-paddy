import { DynamoService } from '@backend-template/database';
import { Global, Module } from '@nestjs/common';

import { SecretsModule } from '../secrets/secrets.module';
import { SecretsService } from '../secrets/secrets.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  imports: [SecretsModule],
  providers: [
    {
      provide: DynamoService,
      inject: [SecretsService],
      useFactory: (secrets: SecretsService) => {
        return new DynamoService(secrets.get('AWS_REGION'));
      },
    },
    S3Service,
  ],
  exports: [DynamoService, S3Service],
})
export class LibrariesModule {}
