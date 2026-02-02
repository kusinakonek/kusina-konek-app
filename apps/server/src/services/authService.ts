import { SignInInput, SignUpInput } from "@kusinakonek/common";
import { prisma, supabaseAdmin } from "@kusinakonek/database";

export const authService = {
  async signUp(input: SignUpInput) {
    const { email, password, displayName, role } = input;

    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password
    });

    if (error || !data.user) {
      throw new Error(error?.message ?? "Supabase signup failed");
    }

    const profile = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        displayName,
        role
      }
    });

    return {
      user: profile
    };
  },

  async signIn(input: SignInInput) {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      session: data.session,
      user: data.user
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
