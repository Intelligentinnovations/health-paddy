import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-yet';

import { AppController } from './app/app.controller';
import { AppRepo } from './app/app.repo';
import { AppService } from './app/app.service';
import { LibrariesModule } from './libraries/libraries.module';
import { SecretsModule } from './secrets/secrets.module';
import { SecretsService } from './secrets/secrets.service';

@Module({
  imports: [
    LibrariesModule,
    SecretsModule,
    CacheModule.registerAsync({
      useFactory: async (secrets: SecretsService) => {
        return {
          isGlobal: true,
          store: await redisStore({ url: secrets.get('REDIS_URL') }),
        };
      },
      inject: [SecretsService],
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppRepo],
})
export class AppModule {}
