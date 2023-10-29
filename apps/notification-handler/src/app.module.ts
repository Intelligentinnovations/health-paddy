import { Module } from '@nestjs/common';

import { LibrariesModule } from './libraries/libraries.module';
import { NotificationModule } from './notification/notification.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [SecretsModule, LibrariesModule, NotificationModule],
})
export class AppModule {}
