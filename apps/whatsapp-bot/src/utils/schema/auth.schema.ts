import { z } from 'zod';

export const EmailSchema = z.object({
  email: z.string().email(),
});

export const StringSchema = z.string();

export const ParsedNumber = z.number();


export type EmailData = z.infer<typeof EmailSchema>;
