import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    supabaseAccessToken?: string; // 👈 add this
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string;
      totalPoints?: number;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role?: string;
    totalPoints?: number;
    access_token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role?: string;
    totalPoints?: number;
    supabaseAccessToken?: string; // 👈 add this here too
  }
}
