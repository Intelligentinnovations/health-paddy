import { z } from 'zod';

export const AppSchema = z.object({
  email: z.string().email(),
});

export type AppData = z.infer<typeof AppSchema>;
