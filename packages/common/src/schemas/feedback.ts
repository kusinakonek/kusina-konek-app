import { z } from "zod";

export const createFeedbackSchema = z.object({
  disID: z.string().uuid(),
  ratingScore: z.number().int().min(1).max(5),
  comments: z.string().min(1).optional()
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
