// types/next-auth.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: string;
      totalPoints: number;
    };
    supabaseAccessToken?: string | null;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
    totalPoints: number;
    access_token?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    totalPoints: number;
    supabaseAccessToken?: string | null;
  }
}
