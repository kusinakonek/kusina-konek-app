import { z } from "zod";

export const createDropOffLocationSchema = z.object({
  foodID: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  streetAddress: z.string().min(2),
  barangay: z.string().min(2).optional()
});

export const updateDropOffLocationSchema = createDropOffLocationSchema.partial();

export type CreateDropOffLocationInput = z.infer<typeof createDropOffLocationSchema>;
export type UpdateDropOffLocationInput = z.infer<typeof updateDropOffLocationSchema>;
