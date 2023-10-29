import { Global, Module } from '@nestjs/common';

import { FileRepo } from './file.repo';

@Global()
@Module({
  providers: [FileRepo],
  exports: [FileRepo],
})
export class RepoModule {}
