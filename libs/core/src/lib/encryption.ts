import { createCipheriv, createDecipheriv, createHash } from 'crypto';

export const encryptData = <T>(data: T) => {
  const key = createHash('sha512')
    .update(process.env.ENCRYPTION_KEY ?? '')
    .digest('hex')
    .substring(0, 32);

  const encryptionIV = createHash('sha512')
    .update(process.env.ENCRYPTION_IV ?? '')
    .digest('hex')
    .substring(0, 16);

  const cipher = createCipheriv('aes-256-cbc', Buffer.from(key), encryptionIV);

  return Buffer.from(
    cipher.update(JSON.stringify(data), 'utf8', 'hex') + cipher.final('hex')
  ).toString('base64');
};

export const decryptData = <T>(encryptedData: string): T => {
  const key = createHash('sha512')
    .update(process.env.ENCRYPTION_KEY ?? '')
    .digest('hex')
    .substring(0, 32);

  const encryptionIV = createHash('sha512')
    .update(process.env.ENCRYPTION_IV ?? '')
    .digest('hex')
    .substring(0, 16);

  const buff = Buffer.from(encryptedData, 'base64');
  const decipher = createDecipheriv('aes-256-cbc', key, encryptionIV);

  return JSON.parse(
    decipher.update(buff.toString(), 'hex', 'utf8') + decipher.final('utf8')
  ) as T;
};
