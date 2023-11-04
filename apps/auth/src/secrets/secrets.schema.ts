import { z } from 'zod';

export const schema = {
  BASE_ROUTE: z.string().optional(),
  PORT: z.coerce.number().optional(),
  USER_POOL_ID: z.string(),
  USER_POOL_CLIENT_ID: z.string(),
  USER_POOL_CLIENT_SECRET: z.string(),
  AWS_REGION: z.string().optional(),
} as const;

export const objectSchema = z.object(schema);
