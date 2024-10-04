import { z } from 'zod';

export const CalculateCalorieSchema = z.object({
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  phone: z.string(),
});

export type CalculateCaloriePayload = z.infer<typeof CalculateCalorieSchema>;

export const HealthGoalSchema = z.object({
  goal: z.enum(['lose-weight', 'gain-weight', 'maintain-weight']),
  phone: z.string()
});

export type HealthGoalPayload = z.infer<typeof HealthGoalSchema>;

export const TargetWeightSchema = z.object({
  weight: z.number(),
  phone: z.string()
});

export type TargetWeightPayload = z.infer<typeof TargetWeightSchema>;


export const BioDataSchema = z.object({
  phone: z.string(),
  dateOfBirth: z.string().email(),
  gender: z.enum(['male', 'female']),
  weight: z.number(),
  height: z.string().refine((value) => {
    const heightRegex = /^([4-7])'(\d{1,2})"$/;
    const match = value.match(heightRegex);
    if (!match) return false;

    const feet = parseInt(match[1], 10);
    const inches = parseInt(match[2], 10);

    return inches >= 0 && inches < 12;
  }, {
    message: "Invalid height format. Must be in the format 'X'Y\" (e.g., 5'10\")."
  }).transform((value) => {
  // Convert the value to the format without double quotes, e.g., 5'7 instead of 5'7"
  return value.replace('"', '');
})})

export type BioDataPayload = z.infer<typeof BioDataSchema>;

