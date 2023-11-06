import { AuthenticatedGuard } from '@backend-template/authorizer';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app/app.controller';
import { AppService } from './app/app.service';
import { LibrariesModule } from './libraries/libraries.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [LibrariesModule, SecretsModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthenticatedGuard }],
})
export class AppModule {}
