import { z } from 'zod';

export const CalculateCalorieSchema = z.object({
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  phone: z.string(),
});

export type CalculateCaloriePayload = z.infer<typeof CalculateCalorieSchema>;


