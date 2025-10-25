// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase';

// Rate limiting map
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

// Welcome bonus points
const WELCOME_BONUS_POINTS = 100;

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  institution: z.string().optional(),
  researchField: z.string().optional(),
  country: z.string().optional()
});

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Rate limiting check
    const now = Date.now();
    const attempts = signupAttempts.get(clientIp);
    
    if (attempts) {
      if (now < attempts.resetTime) {
        if (attempts.count >= 5) {
          return NextResponse.json(
            { error: 'Too many signup attempts. Please try again in 15 minutes.' },
            { status: 429 }
          );
        }
      } else {
        signupAttempts.delete(clientIp);
      }
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    const { email, password, fullName, institution, researchField, country } = validatedData;

    console.log('Signup attempt for:', email);

    // Check for duplicate email in Supabase Auth
    const { data: existingAuthUser } = await supabaseServer!.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users.some(u => u.email === email);

    if (emailExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer!.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for simplicity
      user_metadata: {
        full_name: fullName,
        institution: institution || null,
        research_field: researchField || null,
        country: country || null
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: `Signup failed: ${authError.message}` },
        { status: 500 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      throw new Error('User ID not returned from auth');
    }

    console.log('User created in auth:', userId);

    // Create user profile in users table
    const { error: profileError } = await supabaseServer!
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        institution: institution || null,
        research_field: researchField || null,
        country: country || null,
        total_points: 0, // Will be updated by trigger
        avatar_url: null
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback auth user if profile creation fails
      await supabaseServer!.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    console.log('User profile created');

    // Award welcome bonus points
    const { error: pointsError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: WELCOME_BONUS_POINTS,
        transaction_type: 'signup_bonus',
        description: 'Welcome to Africa Research Base!',
        metadata: {
          signup_date: new Date().toISOString(),
          institution: institution || null,
          research_field: researchField || null
        }
      });

    if (pointsError) {
      console.error('Welcome points error:', pointsError);
      // Don't fail signup if points fail
    } else {
      console.log(`Awarded ${WELCOME_BONUS_POINTS} welcome points to user ${userId}`);
    }

    // Update rate limiting
    const currentAttempts = signupAttempts.get(clientIp);
    signupAttempts.set(clientIp, {
      count: (currentAttempts?.count || 0) + 1,
      resetTime: now + (15 * 60 * 1000) // 15 minutes
    });

    // Get updated user points (after trigger runs)
    const { data: updatedProfile } = await supabaseServer!
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        institution,
        researchField,
        country
      },
      rewards: {
        welcomePoints: WELCOME_BONUS_POINTS,
        totalPoints: updatedProfile?.total_points || WELCOME_BONUS_POINTS,
        message: `Welcome! You've received ${WELCOME_BONUS_POINTS} bonus points!`
      },
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Signup failed. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Signup endpoint - use POST to create account',
    welcomeBonus: WELCOME_BONUS_POINTS,
    requirements: {
      email: 'Valid email address',
      password: 'Min 8 chars, uppercase, lowercase, number, special character',
      fullName: 'Min 2 characters'
    }
  });
}