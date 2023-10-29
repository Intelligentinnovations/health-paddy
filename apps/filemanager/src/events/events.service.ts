import { CustomRes } from '@backend-template/helpers';
import { Injectable } from '@nestjs/common';

import { FileRepo } from '../repo/file.repo';
import { FileState } from '../utils/types';

@Injectable()
export class EventsService {
  constructor(private fileRepo: FileRepo) {}

  async fileUploaded(key: string) {
    const file = await this.fileRepo
      .fetchFile(key)
      .elseThrow(CustomRes.failed('file with key not found'));

    file.state = file.transcode ? FileState.PROCESSING : FileState.UPLOADED;
    return this.fileRepo.updateFile(file);
  }

  async fileTranscoded(key: string) {
    const file = await this.fileRepo
      .fetchFile(key)
      .elseThrow(CustomRes.failed('file with key not found'));

    file.state = FileState.UPLOADED;

    return this.fileRepo.updateFile(file);
  }
}
