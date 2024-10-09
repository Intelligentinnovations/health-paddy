import { z } from "zod";

export const CalculateCalorieSchema = z.object({
  email: z.string().email(),
  firstname: z.string(),
  lastname: z.string(),
  phone: z.string(),
});

export type CalculateCaloriePayload = z.infer<typeof CalculateCalorieSchema>;

export const HealthGoalSchema = z.object({
  goal: z.enum(["lose-weight", "gain-weight", "maintain-weight"]),
  phone: z.string()
});

export type HealthGoalPayload = z.infer<typeof HealthGoalSchema>;

export const TargetWeightSchema = z.object({
  targetWeight: z.number(),
  phone: z.string()
});

export type TargetWeightPayload = z.infer<typeof TargetWeightSchema>;

export const GoalDurationSchema = z.object({
  durationInMonth: z.number(),
  phone: z.string()
});

export type GoalDurationPayload = z.infer<typeof GoalDurationSchema>;

export const ActivityLevelSchema = z.object({
  activityLevel: z.enum(["sedentary", "mild", "moderate", "heavy", "extreme"]),
  phone: z.string()
});

export type ActivityLevelPayload = z.infer<typeof ActivityLevelSchema>;


export const HealthConditionSchema = z.object({
  healthCondition: z.enum(["none", "diabetes/pre-diabetes", "hypertension", "high-cholesterol", "pregnant", "pcos"]),
  phone: z.string()
});

export type HealthConditionPayload = z.infer<typeof HealthConditionSchema>;


export const BioDataSchema = z.object({
  phone: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(["male", "female"]),
  weight: z.number(),
  height: z.string().refine((value) => {
    const regex = /^(\d+)[f']([0-9]|1[0-1])$/;
    const match = value?.match(regex);
    if (!match) {
      return null
    }
    const feet = parseInt(match[1] as string, 10) || 0;
    const inches = parseInt(match[2] as string, 10) || 0;
  
    return { feet, inches };
  }, {
    message: "Invalid height format. Must be in the format 'X'Y\" (e.g., 5'10\")."
  }).transform((value) => {
  // Convert the value to the format without double quotes, e.g., 5'7 instead of 5'7"
  return value.replace("\"", "");
})})

export type BioDataPayload = z.infer<typeof BioDataSchema>;

