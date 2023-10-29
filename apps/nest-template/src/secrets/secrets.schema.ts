import { z } from 'zod';

export const schema = {
  BASE_ROUTE: z.string().optional(),
  PORT: z.coerce.number().optional(),
  REDIS_URL: z.string(),
  DATABASE_URL: z.string(),
  AWS_REGION: z.string().optional(),
} as const;

export const objectSchema = z.object(schema);
