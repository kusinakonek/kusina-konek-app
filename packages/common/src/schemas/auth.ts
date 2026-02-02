import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  role: z.enum(["DONOR", "RECIPIENT", "VOLUNTEER"])
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
