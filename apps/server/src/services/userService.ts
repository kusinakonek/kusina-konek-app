import { CompleteUserProfileInput, Role } from "@kusinakonek/common";
import { prisma, supabaseAdmin } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";
import { roleRepository, userRepository } from "../repositories";
import { sha256Hex, hashPassword } from "../utils/hash";
import { encrypt, decrypt, safeDecrypt, safeDecryptAsync } from "../utils/encryption";
import crypto from "crypto";



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

    // Primary lookup: by emailHash
    const emailHash = sha256Hex(authEmail.toLowerCase());
    let user = await prisma.user.findUnique({
      where: { emailHash },
      include: { role: true, userAddress: true }
    });

    // Fallback lookup: by userID (handles cases where emailHash doesn't match,
    // e.g. user created via a different path or email casing mismatch)
    if (!user && authUserId) {
      user = await prisma.user.findUnique({
        where: { userID: authUserId },
        include: { role: true, userAddress: true }
      });
      if (user) {
        console.log(`[getProfile] Found user by userID fallback (emailHash mismatch). Updating emailHash.`);
        // Fix the emailHash so future lookups work correctly
        try {
          await prisma.user.update({
            where: { userID: authUserId },
            data: { emailHash }
          });
        } catch (e) {
          // Non-fatal: another row may already have this emailHash
          console.warn(`[getProfile] Could not update emailHash:`, e);
        }
      }
    }

    if (!user) {
      // No profile yet — return basic info from auth, signal profile incomplete
      return {
        user: {
          id: authUserId,
          email: authEmail,
          displayName: authEmail?.split('@')[0] || 'User',
          role: null
        },
        profile: null,
        needsProfileUpdate: true,
        profileCompleted: false
      };
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

    // Hash the password with bcrypt (use provided password or a secure random fallback)
    const rawPassword = (input as any).password || crypto.randomBytes(32).toString('hex');
    const hashedPassword = await hashPassword(rawPassword);

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
          password: hashedPassword,
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
  },

  /**
   * Save or update the Expo push token for a user.
   * Also optionally updates their live GPS location.
   */
  async updatePushToken(params: { userID: string; pushToken: string; latitude?: number; longitude?: number }) {
    const { userID, pushToken, latitude, longitude } = params;

    await prisma.user.updateMany({
      where: { userID },
      data: { pushToken },
    });

    // Also update their active coordinates if provided
    if (latitude !== undefined && longitude !== undefined) {
      const address = await prisma.address.findUnique({
        where: { UserID: userID }
      });

      if (address) {
        await prisma.address.update({
          where: { UserID: userID },
          data: { latitude, longitude }
        });
      }
    }
  },

  /**
   * Delete a user's account and all associated data.
   * Uses a transaction to ensure atomicity.
   */
  async deleteAccount(userID: string) {
    // 1. Delete from Supabase Auth (Identity Provider)
    // We do this first or concurrently. If it fails, we shouldn't delete data?
    // Or we delete data first? Usually better to delete data first so we don't have orphan data.
    // However, if we delete data and auth deletion fails, the user is stuck without a profile.
    // Let's delete data first (transaction), then auth user.

    await prisma.$transaction(async (tx) => {
      // Delete notifications
      await tx.notification.deleteMany({ where: { userID } });

      // Delete feedback (as donor or recipient)
      await tx.feedback.deleteMany({
        where: { OR: [{ donorID: userID }, { recipientID: userID }] },
      });

      // Clear recipient references on distributions and delete donor's distributions
      await tx.distribution.updateMany({
        where: { recipientID: userID },
        data: { recipientID: null, status: "PENDING", claimedAt: null },
      });
      await tx.distribution.deleteMany({ where: { donorID: userID } });

      // Delete food items
      await tx.food.deleteMany({ where: { userID } });

      // Delete drop-off locations
      await tx.dropOffLocation.deleteMany({ where: { userID } });

      // Delete address
      await tx.address.deleteMany({ where: { UserID: userID } });

      // Delete the user
      await tx.user.delete({ where: { userID } });
    });

    // 2. Delete from Supabase Auth
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userID);
      if (error) {
        console.error(`[deleteAccount] Failed to delete auth user ${userID}:`, error);
        // We log it but don't throw, as the main data is already gone.
        // It might be already deleted or have other issues.
      } else {
        console.log(`[deleteAccount] Deleted auth user ${userID}`);
      }
    } catch (e) {
      console.error(`[deleteAccount] Exception deleting auth user:`, e);
    }
  },
};
