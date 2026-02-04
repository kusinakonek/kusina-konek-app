import { z } from "zod";

export const completeUserProfileSchema = z
  .object({
    firstName: z.string().min(1),
    middleName: z.string().min(1).optional(),
    lastName: z.string().min(1),
    suffix: z.string().min(1).optional(),

    phoneNo: z.string().min(7),

    isOrg: z.boolean().optional().default(false),
    orgName: z.string().min(2).optional(),

    // Optional address info (creates/updates Address table)
    address: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        streetAddress: z.string().min(2),
        barangay: z.string().min(2)
      })
      .optional()
  })
  .refine((data) => !data.isOrg || !!data.orgName, {
    message: "orgName is required when isOrg is true",
    path: ["orgName"]
  });

export type CompleteUserProfileInput = z.infer<typeof completeUserProfileSchema>;
