import { Module } from '@nestjs/common';

import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';

@Module({
  providers: [ManagerService],
  controllers: [ManagerController],
})
export class ManagerModule {}
