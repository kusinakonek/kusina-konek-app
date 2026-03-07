import { SignInInput, SignUpInput } from "@kusinakonek/common";
import { supabaseAdmin, prisma } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";
import { userRepository } from "../repositories";
import { roleRepository } from "../repositories/roleRepository";
import { encrypt } from "../utils/encryption";
import { sha256Hex, hashPassword } from "../utils/hash";

export interface PasswordResetInput {
  email: string;
}

export interface UpdatePasswordInput {
  password: string;
}

export const authService = {
  /**
   * Register a new user with Supabase Auth and Prisma database.
   * - Password is hashed with bcrypt
   * - PII (email, phone, names) encrypted with AES-256-GCM
   * - Email/phone hashed with SHA-256 for lookups
   */
  async signUp(input: SignUpInput) {
    const { email, password, fullName, barangay, phoneNo } = input;

    // Parse fullName into firstName and lastName
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // Check if user already exists
    const emailHash = sha256Hex(email.toLowerCase());
    const existingUser = await userRepository.getByEmailHash(emailHash);

    if (existingUser) {
      throw new HttpError(409, "An account with this email already exists");
    }

    // Hash password with bcrypt
    const hashedPassword = await hashPassword(password);

    // Encrypt PII with AES-256-GCM
    const encryptedEmail = encrypt(email);
    const encryptedFirstName = encrypt(firstName);
    const encryptedLastName = encrypt(lastName);
    const encryptedPhoneNo = phoneNo ? encrypt(phoneNo) : encrypt("0000000000");
    const phoneNoHash = phoneNo ? sha256Hex(phoneNo) : sha256Hex(`placeholder_${Date.now()}`);

    // Step 1: Create user in Supabase Auth FIRST to get the auth user ID
    // This ID will be used as the Prisma userID so they always match.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: fullName,
      }
    });

    if (error) {
      // Rollback Prisma user if Supabase fails
      await prisma.address.deleteMany({ where: { UserID: newUser.userID } });
      await prisma.user.delete({ where: { userID: newUser.userID } });
      console.error("[Auth Error]:", error.message);
      throw new HttpError(400, error.message);
    }

    const supabaseUserId = data.user.id;

    // Step 2: Create user in Prisma database using the Supabase auth user ID
    // This ensures req.user.id (from JWT) always matches the Prisma userID
    let newUser;
    try {
      newUser = await prisma.$transaction(async (tx) => {
        // Create User record with Supabase auth ID as the primary key
        const user = await tx.user.create({
          data: {
            userID: supabaseUserId,
            firstName: encryptedFirstName,
            lastName: encryptedLastName,
            phoneNo: encryptedPhoneNo,
            phoneNoHash: phoneNoHash,
            email: encryptedEmail,
            emailHash: emailHash,
            password: hashedPassword,
            isOrg: false
          }
        });

        // Create Address record with barangay
        await tx.address.create({
          data: {
            UserID: user.userID,
            latitude: 0,
            longitude: 0,
            streetAddress: "",
            barangay: barangay
          }
        });

        return user;
      });
    } catch (prismaError) {
      // Rollback Supabase user if Prisma fails
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
      console.error("[Prisma Error]:", prismaError);
      throw new HttpError(500, "Failed to create user profile");
    }

    // Update Supabase user metadata with the prisma_user_id (same ID now)
    await supabaseAdmin.auth.admin.updateUserById(supabaseUserId, {
      user_metadata: {
        display_name: fullName,
        prisma_user_id: newUser.userID
      }
    });

    return {
      message: "Account created successfully.",
      user: {
        id: newUser.userID,
        email,
        displayName: fullName
      },
      session: data.user ? { id: data.user.id } : null
    };
  },


  /**
   * Sign in user with email and password
   */
  async signIn(input: SignInInput) {
    const { email, password, role: selectedRole } = input;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("[Auth Error]:", error.message);

      if (error.message.includes("Invalid login credentials")) {
        throw new HttpError(401, "Invalid email or password");
      }

      if (error.message.includes("Email not confirmed")) {
        throw new HttpError(403, "Please verify your email before signing in");
      }

      throw new HttpError(400, error.message);
    }

    // Lookup user by emailHash (since email is encrypted in DB)
    const emailHash = sha256Hex(email.toLowerCase());
    let profile = await userRepository.getByEmailHash(emailHash);

    // Import safeDecrypt function for decrypting user data
    const { safeDecrypt } = await import("../utils/encryption");

    // Auto-link: if the Prisma userID doesn't match the Supabase auth ID,
    // update it so all ensureProfile(req.user.id) lookups work correctly.
    // This handles users who signed up before Supabase ID was used as Prisma PK.
    if (profile && profile.userID !== data.user.id) {
      try {
        await prisma.user.update({
          where: { userID: profile.userID },
          data: { userID: data.user.id }
        });
        // Re-fetch the updated profile
        profile = await userRepository.getByEmailHash(emailHash);
      } catch (linkError) {
        console.warn("[Auth] Could not auto-link Prisma userID to Supabase ID:", linkError);
        // Continue with the old profile — dashboard (email-based) still works
      }
    }

    // Update Supabase user metadata with the selected role for this session
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        ...data.user.user_metadata,
        role: selectedRole // Use the role selected at login
      }
    });

    // Update user's lastLoginAt and ensure isActive is true
    try {
      await prisma.user.update({
        where: { userID: profile?.userID || data.user.id },
        data: {
          lastLoginAt: new Date(),
          isActive: true
        }
      });
    } catch (updateError) {
      console.error("[Auth] Failed to update lastLoginAt and isActive status:", updateError);
    }

    return {
      message: "Signed in successfully",
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at
      },
      user: profile
        ? {
          id: profile.userID,
          email: email, // Return plain email from input
          firstName: safeDecrypt(profile.firstName),
          lastName: safeDecrypt(profile.lastName),
          displayName: `${safeDecrypt(profile.firstName)} ${safeDecrypt(profile.lastName)}`.trim(),
          role: selectedRole, // Return the selected role, not the DB role
          phoneNo: profile.phoneNo ? safeDecrypt(profile.phoneNo) : null
        }
        : {
          id: data.user.id,
          email: data.user.email,
          displayName: data.user.user_metadata?.display_name,
          role: selectedRole // Return the selected role
        }
    };
  },


  /**
   * Sign out user (invalidate session)
   */
  async signOut(accessToken: string) {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);

    if (error) {
      console.error("[Auth Error]:", error.message);
      throw new HttpError(400, "Failed to sign out");
    }

    return {
      message: "Signed out successfully"
    };
  },

  /**
   * Get current user profile
   */
  async getProfile(params: { userId: string; email?: string; role?: string }) {
    const profile = await userRepository.getByUserId(params.userId);

    if (!profile) {
      return {
        user: {
          id: params.userId,
          email: params.email,
          displayName: undefined,
          role: params.role,
          createdAt: undefined
        },
        profileCompleted: false
      };
    }

    return {
      user: {
        id: profile.userID,
        email: profile.email,
        displayName: userRepository.toDisplayName(profile),
        role: profile.role?.roleName,
        createdAt: profile.DateAdded
      },
      profileCompleted: true
    };
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(input: PasswordResetInput) {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(input.email, {
      redirectTo: `${process.env.CORS_ORIGIN}/reset-password`
    });

    if (error) {
      console.error("[Auth Error]:", error.message);
      // Don't reveal if email exists for security
    }

    // Always return success to prevent email enumeration
    return {
      message: "If an account with this email exists, a password reset link has been sent"
    };
  },

  /**
   * Update user password (requires valid session)
   */
  async updatePassword(userId: string, input: UpdatePasswordInput) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password
    });

    if (error) {
      console.error("[Auth Error]:", error.message);
      throw new HttpError(400, "Failed to update password");
    }

    return {
      message: "Password updated successfully"
    };
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      console.error("[Auth Error]:", error.message);
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    return {
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at
      }
    };
  },

  /**
   * Resend email verification
   */
  async resendVerification(email: string) {
    const { error } = await supabaseAdmin.auth.resend({
      type: "signup",
      email
    });

    if (error) {
      console.error("[Auth Error]:", error.message);
      // Don't reveal if email exists for security
    }

    return {
      message: "If an account with this email exists and is unverified, a verification email has been sent"
    };
  },

  /**
   * Check if email or phone number is available
   */
  async checkAvailability(email?: string, phoneNo?: string) {
    const result = {
      emailAvailable: true,
      phoneAvailable: true
    };

    if (email) {
      const emailHash = sha256Hex(email.toLowerCase());
      const user = await userRepository.getByEmailHash(emailHash);
      if (user) {
        result.emailAvailable = false;
      }
    }

    if (phoneNo) {
      const phoneNoHash = sha256Hex(phoneNo);
      const user = await userRepository.getByPhoneNoHash(phoneNoHash);
      if (user) {
        result.phoneAvailable = false;
      }
    }

    return result;
  }
};

