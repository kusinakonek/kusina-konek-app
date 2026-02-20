import { z } from "zod";

export const createFeedbackSchema = z.object({
  disID: z.string().uuid(),
  ratingScore: z.number().int().min(1).max(5),
  comments: z.string().optional(),
  photoUrl: z.string().optional()
});

export const updateFeedbackSchema = z.object({
  ratingScore: z.number().int().min(1).max(5).optional(),
  comments: z.string().optional()
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
