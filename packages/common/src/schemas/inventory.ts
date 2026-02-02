import { z } from "zod";

export const createFoodItemSchema = z.object({
  title: z.string().min(2),
  quantity: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  photoUrl: z.string().url().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
