import { z } from "zod";

export const createDistributionSchema = z.object({
  recipientID: z.string().uuid(),
  locID: z.string().uuid(),
  foodID: z.string().uuid(),
  quantity: z.number().int().positive(),
  scheduledTime: z.string().datetime(),
  photoProof: z.string().url().optional()
});

export const markDistributionCompleteSchema = z.object({
  actualTime: z.string().datetime().optional()
});

export type CreateDistributionInput = z.infer<typeof createDistributionSchema>;
export type MarkDistributionCompleteInput = z.infer<typeof markDistributionCompleteSchema>;
