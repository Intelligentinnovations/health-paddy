import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  CloudfrontSignedCookiesOutput,
  getSignedCookies,
  getSignedUrl as cloudfrontSignedUrl,
} from '@aws-sdk/cloudfront-signer';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomRes } from '@backend-template/helpers';
import { UploadFileData } from '@backend-template/types';
import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';

import { S3Service } from '../libraries/s3.service';
import { FileRepo } from '../repo/file.repo';
import { SecretsService } from '../secrets/secrets.service';
import { FileData, FileState } from '../utils/types';

@Injectable()
export class ManagerService {
  constructor(
    private fileRepo: FileRepo,
    private secrets: SecretsService,
    private s3Service: S3Service
  ) {}

  generateSignedUrl(url: string): string {
    return cloudfrontSignedUrl({
      url,
      dateLessThan: DateTime.now().plus({ hours: 24 }).toISO() ?? '',
      keyPairId: this.secrets.get('CLOUDFRONT_KEYPAIR_ID'),
      privateKey: Buffer.from(
        this.secrets.get('CLOUDFRONT_PRIVATE_KEY'),
        'base64'
      ),
    });
  }

  generateSignedCookie(url: string): CloudfrontSignedCookiesOutput {
    return getSignedCookies({
      dateLessThan: DateTime.now().plus({ hours: 24 }).toJSDate().toISOString(),
      url,
      keyPairId: this.secrets.get('CLOUDFRONT_KEYPAIR_ID'),
      privateKey: Buffer.from(
        this.secrets.get('CLOUDFRONT_PRIVATE_KEY'),
        'base64'
      ),
    });
  }

  async uploadFile(data: UploadFileData) {
    const transcode = data.fileType.type === 'video' && data.fileType.transcode;

    const baseKey = [
      data.secure ? 'private' : 'public',
      data.fileType.type,
      `${data.fileName}_${DateTime.now().toMillis()}`,
    ].join('/');

    const key = `uploads/${baseKey}.${data.fileType.extension}`;
    const url = `https://${this.secrets.get('DOMAIN')}/${key}`;

    const file: FileData = { url, key, transcode, state: FileState.PENDING };

    const existing = await this.fileRepo.fetchFile(file.key).elseNull();
    if (existing) throw CustomRes.failed('file with name already exist');

    await this.fileRepo.createFile(file);

    file.uploadUrl = await getSignedUrl(
      this.s3Service,
      new PutObjectCommand({
        Bucket: this.secrets.get('BUCKET_NAME'),
        Key: file.key,
      }),
      { expiresIn: 86400 }
    );

    if (!file.uploadUrl)
      throw CustomRes.serverError('error generating upload url');

    return file;
  }
}
