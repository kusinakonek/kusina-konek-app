import { SignInInput, SignUpInput } from "@kusinakonek/common";
import { prisma, supabaseAdmin } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";

export interface PasswordResetInput {
  email: string;
}

export interface UpdatePasswordInput {
  password: string;
}

export const authService = {
  /**
   * Register a new user with Supabase Auth and create a profile in the database
   */
  async signUp(input: SignUpInput) {
    const { email, password, displayName, role } = input;

    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new HttpError(409, "An account with this email already exists");
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          role: role
        }
      }
    });

    if (error) {
      console.error("[Auth Error]:", error.message);
      throw new HttpError(400, error.message);
    }

    if (!data.user) {
      throw new HttpError(500, "Failed to create user account");
    }

    // Create user profile in our database
    const profile = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        displayName,
        role
      }
    });

    return {
      message: "Account created successfully. Please check your email to verify your account.",
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role
      },
      session: data.session
    };
  },

  /**
   * Sign in user with email and password
   */
  async signIn(input: SignInInput) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password
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

    // Fetch user profile from our database
    const profile = await prisma.user.findUnique({
      where: { id: data.user.id }
    });

    return {
      message: "Signed in successfully",
      session: {
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at
      },
      user: profile ?? {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.display_name,
        role: data.user.user_metadata?.role
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
  async getProfile(userId: string) {
    const profile = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!profile) {
      throw new HttpError(404, "User profile not found");
    }

    return {
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        createdAt: profile.createdAt
      }
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

  async getProfile(userId?: string) {
    if (!userId) {
      throw new Error("Missing user id");
    }

    return prisma.user.findUnique({
      where: { id: userId }
    });
  }
};

