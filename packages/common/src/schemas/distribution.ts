import { z } from "zod";

export const createDistributionSchema = z.object({
  recipientID: z.string().uuid().optional(),
  locID: z.string().uuid(),
  foodID: z.string().uuid(),
  quantity: z.string().min(1),
  scheduledTime: z.string().datetime(),
  photoProof: z.string().url().optional(),
});

export const updateDistributionSchema = z.object({
  recipientID: z.string().uuid().optional(),
  locID: z.string().uuid().optional(),
  foodID: z.string().uuid().optional(),
  quantity: z.number().int().positive().optional(),
  scheduledTime: z.string().datetime().optional(),
  photoProof: z.string().url().optional(),
});

export const updateDistributionStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CLAIMED",
    "ON_THE_WAY",
    "DELIVERED",
    "COMPLETED",
  ]),
});

export const markDistributionCompleteSchema = z.object({
  actualTime: z.string().datetime().optional(),
});

export const requestDistributionSchema = z.object({
  scheduledTime: z.string().datetime().optional(),
  photoProof: z.string().url().optional(),
});

export type CreateDistributionInput = z.infer<typeof createDistributionSchema>;
export type UpdateDistributionInput = z.infer<typeof updateDistributionSchema>;
export type UpdateDistributionStatusInput = z.infer<
  typeof updateDistributionStatusSchema
>;
export type MarkDistributionCompleteInput = z.infer<
  typeof markDistributionCompleteSchema
>;
export type RequestDistributionInput = z.infer<
  typeof requestDistributionSchema
>;
