import { CloudfrontSignedCookiesOutput } from '@aws-sdk/cloudfront-signer';

export interface FileService {
  fileUploaded(key: string): Promise<void>;
  fileTranscoded(key: string): Promise<void>;
  generateSignedUrl(url: string): string;
  generateSignedCookie(url: string): CloudfrontSignedCookiesOutput;
}
