import { z } from 'zod';

export const schema = {
  BASE_ROUTE: z.string().optional(),
  PORT: z.coerce.number().optional(),
  REDIS_URL: z.string(),
  DATABASE_URL: z.string(),
  AWS_REGION: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  VERIFY_TOKEN: z.string(),
  WHATSAPP_TOKEN: z.string(),
  PHONE_NUMBER_ID: z.string(),
  SUBSCRIPTION_AMOUNT: z.coerce.number(),
  PAYSTACK_WEBHOOK: z.string()
} as const;

export const objectSchema = z.object(schema);
