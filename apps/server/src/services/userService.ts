import { CompleteUserProfileInput, Role } from "@kusinakonek/common";
import { prisma } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";
import { roleRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";
import { encrypt, decrypt, safeDecrypt, safeDecryptAsync } from "../utils/encryption";

const SUPABASE_MANAGED_PASSWORD = "__SUPABASE_MANAGED__";

const normalizeRole = (value: unknown): Role | undefined => {
  if (typeof value !== "string") return undefined;
  const upper = value.toUpperCase();
  if (upper === "DONOR" || upper === "RECIPIENT") return upper as Role;
  return undefined;
};

export const userService = {
  /**
   * Get user profile (decrypted)
   */
  async getProfile(params: { authUserId: string; authEmail?: string }) {
    const { authUserId, authEmail } = params;

    if (!authEmail) {
      throw new HttpError(400, "Authenticated email is missing");
    }

    // Lookup user by emailHash
    const emailHash = sha256Hex(authEmail.toLowerCase());
    const user = await prisma.user.findUnique({
      where: { emailHash },
      include: { role: true, userAddress: true }
    });

    if (!user) {
      throw new HttpError(404, "Profile not found. Please complete your profile first.");
    }

    // Decrypt PII fields using async decryption (handles both AES and PGP)
    const firstName = await safeDecryptAsync(user.firstName);
    const lastName = await safeDecryptAsync(user.lastName);
    const middleName = user.middleName ? await safeDecryptAsync(user.middleName) : null;
    const suffix = user.suffix ? await safeDecryptAsync(user.suffix) : null;
    const phoneNo = user.phoneNo ? await safeDecryptAsync(user.phoneNo) : null;
    const orgName = user.orgName ? await safeDecryptAsync(user.orgName) : null;

    // Decrypt address fields if address exists
    const address = user.userAddress
      ? {
          latitude: user.userAddress.latitude,
          longitude: user.userAddress.longitude,
          streetAddress: await safeDecryptAsync(user.userAddress.streetAddress),
          barangay: await safeDecryptAsync(user.userAddress.barangay)
        }
      : null;

    // Detect if essential fields are empty/missing after decryption
    // (happens when profile was created with old PGP encryption from Supabase RPC)
    const needsProfileUpdate = !firstName || !lastName;

    return {
      user: {
        id: user.userID,
        email: authEmail,
        displayName: (firstName && lastName) ? `${firstName} ${lastName}`.trim() : (authEmail?.split('@')[0] || 'User'),
        role: user.role?.roleName as Role
      },
      profile: {
        firstName: firstName || '',
        middleName,
        lastName: lastName || '',
        suffix,
        phoneNo: phoneNo || '',
        isOrg: user.isOrg,
        orgName,
        address
      },
      needsProfileUpdate
    };
  },

  async completeProfile(params: {
    authUserId: string;
    authEmail?: string;
    authRole?: string;
    input: CompleteUserProfileInput;
  }) {
    const { authUserId, authEmail, authRole, input } = params;

    if (!authEmail) {
      throw new HttpError(400, "Authenticated email is missing");
    }

    // Try to get role from JWT token first, then fallback to request body
    const roleFromToken = normalizeRole(authRole);
    const roleFromInput = normalizeRole((input as any).role);
    const roleName = roleFromToken || roleFromInput;

    if (!roleName) {
      throw new HttpError(400, "User role is missing or invalid. Please provide 'role' as 'DONOR' or 'RECIPIENT'.");
    }

    const role = await roleRepository.getByName(roleName);
    if (!role) {
      throw new HttpError(500, `Role '${roleName}' not found in database. Run seed/migrations.`);
    }

    // Hash for indexed lookups
    const emailHash = sha256Hex(authEmail.toLowerCase());
    const phoneNoHash = sha256Hex(input.phoneNo);

    // Encrypt PII with AES-256-GCM
    const encryptedEmail = encrypt(authEmail);
    const encryptedFirstName = encrypt(input.firstName);
    const encryptedMiddleName = input.middleName ? encrypt(input.middleName) : null;
    const encryptedLastName = encrypt(input.lastName);
    const encryptedSuffix = input.suffix ? encrypt(input.suffix) : null;
    const encryptedPhoneNo = encrypt(input.phoneNo);
    const encryptedOrgName = input.orgName ? encrypt(input.orgName) : null;

    try {
      const user = await prisma.user.upsert({
        where: { emailHash },
        create: {
          userID: authUserId,
          roleID: role.roleID,
          firstName: encryptedFirstName,
          middleName: encryptedMiddleName,
          lastName: encryptedLastName,
          suffix: encryptedSuffix,
          phoneNo: encryptedPhoneNo,
          phoneNoHash,
          email: encryptedEmail,
          emailHash,
          isOrg: input.isOrg ?? false,
          orgName: encryptedOrgName,
          password: SUPABASE_MANAGED_PASSWORD,
          ...(input.address
            ? {
              userAddress: {
                create: {
                  latitude: input.address.latitude,
                  longitude: input.address.longitude,
                  streetAddress: input.address.streetAddress,
                  barangay: input.address.barangay
                }
              }
            }
            : {})
        },
        update: {
          roleID: role.roleID,
          firstName: encryptedFirstName,
          middleName: encryptedMiddleName,
          lastName: encryptedLastName,
          suffix: encryptedSuffix,
          phoneNo: encryptedPhoneNo,
          phoneNoHash,
          email: encryptedEmail,
          emailHash,
          isOrg: input.isOrg ?? false,
          orgName: encryptedOrgName,
          ...(input.address
            ? {
              userAddress: {
                upsert: {
                  create: {
                    latitude: input.address.latitude,
                    longitude: input.address.longitude,
                    streetAddress: input.address.streetAddress,
                    barangay: input.address.barangay
                  },
                  update: {
                    latitude: input.address.latitude,
                    longitude: input.address.longitude,
                    streetAddress: input.address.streetAddress,
                    barangay: input.address.barangay
                  }
                }
              }
            }
            : {})
        },
        include: { role: true, userAddress: true }
      });

      // Decrypt for response
      return {
        message: "Profile completed successfully",
        user: {
          id: user.userID,
          email: authEmail, // Return plain email
          displayName: `${input.firstName} ${input.lastName}`.trim(),
          role: user.role?.roleName as Role
        },
        profile: {
          firstName: input.firstName,
          middleName: input.middleName || null,
          lastName: input.lastName,
          suffix: input.suffix || null,
          phoneNo: input.phoneNo,
          isOrg: user.isOrg,
          orgName: input.orgName || null,
          address: user.userAddress
            ? {
              latitude: user.userAddress.latitude,
              longitude: user.userAddress.longitude,
              streetAddress: user.userAddress.streetAddress,
              barangay: user.userAddress.barangay
            }
            : null
        }
      };
    } catch (error: any) {
      const message = typeof error?.message === "string" ? error.message : "Failed to complete profile";

      // Common unique constraint conflicts
      if (message.includes("phoneNoHash") || message.includes("emailHash")) {
        throw new HttpError(409, "A profile with the same email/phone already exists");
      }

      throw error;
    }
  }
};
