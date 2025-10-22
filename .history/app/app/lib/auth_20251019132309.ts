// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
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
          // Use Supabase Auth for authentication
          if (!supabaseServer) {
            throw new Error('Database connection error');
          }

          const { data, error } = await supabaseServer.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });

          if (error || !data.user) {
            throw new Error('Invalid email or password');
          }

          // Get user profile from our users table
          const { data: profile } = await supabaseServer
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          return {
            id: data.user.id,
            email: data.user.email!,
            name: profile?.full_name || null,
            image: profile?.avatar_url || null,
            role: profile?.role || 'researcher',
            totalPoints: profile?.total_points || 0
          };

        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed. Please try again.');
        }
      }
    })
  ],
  
  pages: {
    signIn: '/', // Custom sign-in page (we'll use modal)
    error: '/',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.totalPoints = user.totalPoints;
      }

      // Update token on session update
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
      return session;
    }
  },

  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    }
  },

  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === 'development',
};