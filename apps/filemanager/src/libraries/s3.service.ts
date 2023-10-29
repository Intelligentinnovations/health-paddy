import { S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service extends S3Client {
  constructor() {
    super({});
  }
}
