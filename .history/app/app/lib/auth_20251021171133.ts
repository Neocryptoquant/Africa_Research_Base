import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseServer } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
          throw new Error('Invalid email format');
        }

        try {
          // Authenticate with Supabase
          if (!supabaseServer) {
            throw new Error('Database connection error');
          }

          const { data, error } = await supabaseServer.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });

          if (error || !data.user) {
            console.error('Supabase auth error:', error);
            throw new Error('Invalid email or password');
          }

          // Fetch user profile
          const { data: profile, error: profileError } = await supabaseServer
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw new Error('Failed to fetch user profile');
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.full_name || null,
            image: profile?.avatar_url || null,
            role: profile?.role || 'researcher',
            totalPoints: profile?.total_points || 0,
            access_token: data.session?.access_token || null, // ✅ Add this
          };

        } catch (error) {
          console.error('Auth error:', error);
          if (error instanceof Error) throw error;
          throw new Error('Authentication failed. Please try again.');
        }
      }
    })
  ],

  pages: {
    signIn: '/',
    error: '/',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.totalPoints = user.totalPoints;
        token.supabaseAccessToken = user.access_token || null; // ✅ Add this
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.totalPoints = token.totalPoints as number;
      }

      session.supabaseAccessToken = token.supabaseAccessToken; // ✅ Add this
      return session;
    }
  },

  events: {
    async signIn({ user }) {
      console.log(`✅ User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`🚪 User signed out: ${token?.email}`);
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
