import { z } from "zod";

export const createFoodSchema = z.object({
  foodName: z.string().min(2),
  dateCooked: z.string().datetime().optional(),
  description: z.string().min(1).optional(),
  ingredients: z.string().optional(),
  quantity: z.string().min(1),
  image: z.string().optional(),
  availabilityDuration: z.number().optional(), // Added for backwards compatibility but not strictly needed if expireAt is used
  expireAt: z.string().datetime().optional(), // New field for precise expiration time
  locations: z
    .array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        streetAddress: z.string().min(2),
        barangay: z.string().min(2).optional(),
      }),
    )
    .optional(),
  scheduledTime: z.string().datetime(),
  photoProof: z.string().optional(),
});

export const requestDonationSchema = z.object({
  foodID: z.string().uuid(),
  scheduledTime: z.string().datetime(),
  photoProof: z.string().optional(),
});

export const updateFoodSchema = createFoodSchema.partial();

export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
export type RequestDonationInput = z.infer<typeof requestDonationSchema>;
