import { CompleteUserProfileInput, Role } from "@kusinakonek/common";
import { prisma } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";
import { roleRepository, userRepository } from "../repositories";
import { sha256Hex } from "../utils/hash";

const SUPABASE_MANAGED_PASSWORD = "__SUPABASE_MANAGED__";

const normalizeRole = (value: unknown): Role | undefined => {
  if (value === "DONOR" || value === "RECIPIENT") return value;
  return undefined;
};

export const userService = {
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

    const roleName = normalizeRole(authRole);
    if (!roleName) {
      throw new HttpError(400, "User role is missing or invalid");
    }

    const role = await roleRepository.getByName(roleName);
    if (!role) {
      throw new HttpError(500, `Role '${roleName}' not found in database. Run seed/migrations.`);
    }

    const emailHash = sha256Hex(authEmail.toLowerCase());
    const phoneNoHash = sha256Hex(input.phoneNo);

    try {
      const user = await prisma.user.upsert({
        where: { userID: authUserId },
        create: {
          userID: authUserId,
          roleID: role.roleID,
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          suffix: input.suffix ?? null,
          phoneNo: input.phoneNo,
          phoneNoHash,
          email: authEmail,
          emailHash,
          isOrg: input.isOrg ?? false,
          orgName: input.orgName ?? null,
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
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          suffix: input.suffix ?? null,
          phoneNo: input.phoneNo,
          phoneNoHash,
          email: authEmail,
          emailHash,
          isOrg: input.isOrg ?? false,
          orgName: input.orgName ?? null,
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

      return {
        message: "Profile completed successfully",
        user: {
          id: user.userID,
          email: user.email,
          displayName: userRepository.toDisplayName(user),
          role: user.role.roleName as Role
        },
        profile: {
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          suffix: user.suffix,
          phoneNo: user.phoneNo,
          isOrg: user.isOrg,
          orgName: user.orgName,
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
