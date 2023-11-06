import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  email_verified: z.coerce.boolean(),
  sub: z.string(),
});

export type UserData = z.infer<typeof UserSchema>;
