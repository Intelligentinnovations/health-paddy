import { z } from 'zod';

export const schema = {
  BASE_ROUTE: z.string().optional(),
  PORT: z.coerce.number().optional(),
  TABLE_NAME: z.string(),
  AWS_REGION: z.string().optional(),
  CLOUDFRONT_KEYPAIR_ID: z.string(),
  CLOUDFRONT_PRIVATE_KEY: z.string(),
  BUCKET_NAME: z.string(),
  DOMAIN: z.string(),
} as const;

export const objectSchema = z.object(schema);
