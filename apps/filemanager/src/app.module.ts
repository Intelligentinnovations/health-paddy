import { Module } from '@nestjs/common';

import { EventsModule } from './events/events.module';
import { LibrariesModule } from './libraries/libraries.module';
import { ManagerModule } from './manager/manager.module';
import { RepoModule } from './repo/repo.module';
import { SecretsModule } from './secrets/secrets.module';

@Module({
  imports: [
    LibrariesModule,
    SecretsModule,
    RepoModule,
    ManagerModule,
    EventsModule,
  ],
})
export class AppModule {}
