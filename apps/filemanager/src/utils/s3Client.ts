import { S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client;

export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({});
  }

  return s3Client;
}
