import { z } from 'zod';

export const schema = {
  AWS_REGION: z.string().optional(),
  MAIL_FROM: z.string().email(),
} as const;

export const objectSchema = z.object(schema);
