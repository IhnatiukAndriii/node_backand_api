import { z } from 'zod';

export const promptSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(1000, 'Text too long (max 1000 characters)'),
  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

export const habitQuerySchema = z.object({
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
});

export const habitIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const completionBodySchema = z.object({
  habit_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  scheduled_time: z.string().optional(),
  note: z.string().max(500).optional(),
});
