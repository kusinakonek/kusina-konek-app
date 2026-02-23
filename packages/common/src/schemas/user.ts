import { z } from "zod";

export const completeUserProfileSchema = z
  .object({
    firstName: z.string().min(1),
    middleName: z.string().min(1).nullish(),
    lastName: z.string().min(1),
    suffix: z.string().min(1).nullish(),
    role: z.enum(["DONOR", "RECIPIENT", "ADMIN"]).optional(),

    phoneNo: z.string().min(7),

    // Organization fields - commented out for now
    // isOrg: z.boolean().optional().default(false),
    // orgName: z.string().min(2).nullish(),
    isOrg: z.boolean().optional().default(false),
    orgName: z.string().min(2).nullish(),

    // Password (optional — used during initial profile creation to bcrypt-hash it)
    password: z.string().optional(),

    // Optional address info (creates/updates Address table)
    address: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        streetAddress: z.string().default(""),   // empty is fine during signup
        barangay: z.string().min(1)              // at least 1 char
      })
      .optional()
  });
  // Organization refinement - commented out for now
  // .refine((data) => !data.isOrg || !!data.orgName, {
  //   message: "orgName is required when isOrg is true",
  //   path: ["orgName"]
  // });

export type CompleteUserProfileInput = z.infer<typeof completeUserProfileSchema>;
