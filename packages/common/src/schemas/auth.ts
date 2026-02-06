import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  barangay: z.string().min(2),
  phoneNo: z.string().min(7).optional()
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["DONOR", "RECIPIENT"])
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
