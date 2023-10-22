import {
  CloudfrontSignedCookiesOutput,
  getSignedCookies,
  getSignedUrl,
} from '@aws-sdk/cloudfront-signer';
import { Res } from '@backend-template/server';
import { DateTime } from 'luxon';

import { FileRepo } from '../../repo';
import { FileRepoImpl } from '../../repo/impl';
import { secrets } from '../../secrets';
import { FileState } from '../../utils';
import { FileService } from '../fileService';

export class FileServiceImpl implements FileService {
  readonly #fileRepo: FileRepo;

  constructor(fileRepo: FileRepo = new FileRepoImpl()) {
    this.#fileRepo = fileRepo;
  }

  async fileUploaded(key: string) {
    const file = await this.#fileRepo
      .fetchFile(key)
      .unwrapOrThrow(Res.failed('file with key not found'));

    file.state = file.transcode ? FileState.PROCESSING : FileState.UPLOADED;
    return this.#fileRepo.updateFile(file);
  }

  async fileTranscoded(key: string) {
    const file = await this.#fileRepo
      .fetchFile(key)
      .unwrapOrThrow(Res.failed('file with key not found'));

    file.state = FileState.UPLOADED;

    return this.#fileRepo.updateFile(file);
  }

  generateSignedUrl(url: string): string {
    return getSignedUrl({
      url,
      dateLessThan: DateTime.now().plus({ hours: 24 }).toISO() ?? '',
      keyPairId: secrets.CLOUDFRONT_KEYPAIR_ID,
      privateKey: Buffer.from(secrets.CLOUDFRONT_PRIVATE_KEY, 'base64'),
    });
  }

  generateSignedCookie(url: string): CloudfrontSignedCookiesOutput {
    return getSignedCookies({
      dateLessThan: DateTime.now().plus({ hours: 24 }).toJSDate().toISOString(),
      url,
      keyPairId: secrets.CLOUDFRONT_KEYPAIR_ID,
      privateKey: Buffer.from(secrets.CLOUDFRONT_PRIVATE_KEY, 'base64'),
    });
  }
}
