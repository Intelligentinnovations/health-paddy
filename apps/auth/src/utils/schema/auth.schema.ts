import { z } from 'zod';

export const AuthenticateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const ConfirmAccountSchema = z.object({
  email: z.string().email(),
  code: z.string(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(8),
  code: z.string(),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type AuthenticateData = z.infer<typeof AuthenticateSchema>;
export type ConfirmAccountData = z.infer<typeof ConfirmAccountSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
