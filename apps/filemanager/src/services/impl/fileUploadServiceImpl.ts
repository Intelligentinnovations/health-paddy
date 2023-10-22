import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Res } from '@backend-template/server';
import { UploadFileData } from '@backend-template/types';
import { DateTime } from 'luxon';

import { FileRepo } from '../../repo';
import { FileRepoImpl } from '../../repo/impl';
import { secrets } from '../../secrets';
import { FileData, FileState, getS3Client } from '../../utils';
import { FileUploadService } from '../fileUploadService';

export class FileUploadServiceImpl implements FileUploadService {
  readonly #defaultRepo: FileRepo;

  constructor(defaultRepo: FileRepo = new FileRepoImpl()) {
    this.#defaultRepo = defaultRepo;
  }

  async uploadFile(data: UploadFileData) {
    const transcode = data.fileType.type === 'video' && data.fileType.transcode;

    const baseKey = [
      data.secure ? 'private' : 'public',
      data.fileType.type,
      `${data.fileName}_${DateTime.now().toMillis()}`,
    ].join('/');

    const key = `uploads/${baseKey}.${data.fileType.extension}`;
    const url = `https://${secrets.DOMAIN}/${key}`;

    const file: FileData = { url, key, transcode, state: FileState.PENDING };

    const existing = await this.#defaultRepo.fetchFile(file.key).unwrapOrNull();
    if (existing) throw Res.failed('file with name already exist');

    await this.#defaultRepo.createFile(file);

    file.uploadUrl = await getSignedUrl(
      getS3Client(),
      new PutObjectCommand({ Bucket: secrets.BUCKET_NAME, Key: file.key }),
      { expiresIn: 86400 }
    );

    if (!file.uploadUrl) throw Res.serverError('error generating upload url');

    return file;
  }
}
