import { z } from "zod";

export const createFoodSchema = z.object({
  foodName: z.string().min(2),
  dateCooked: z.string().datetime(),
  description: z.string().min(1).optional(),
  quantity: z.number().int().positive(),
  image: z.string().url().optional()
});

export const updateFoodSchema = createFoodSchema.partial();

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
