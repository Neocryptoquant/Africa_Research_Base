import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { z } from 'zod';

const signupAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = signupAttempts.get(ip);

  if (!attempt || now > attempt.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempt.count++;
  return true;
}

// Input validation schema
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  institution: z.string().optional(),
  researchField: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = signupSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        );
      }
      throw error;
    }

    const { email, password, fullName, institution, researchField, country } = validatedData;

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedFullName = fullName.trim();

    if (!supabaseServer) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Check if user already exists in auth.users
    const { data: existingAuthUser } = await supabaseServer.auth.admin.listUsers();
    const userExists = existingAuthUser?.users.some(u => u.email === sanitizedEmail);

    if (userExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    console.log('Creating new user:', sanitizedEmail);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email: sanitizedEmail,
      password: password,
      email_confirm: true, // Auto-confirm (set to false for email verification)
      user_metadata: {
        full_name: sanitizedFullName,
        institution: institution || null,
        research_field: researchField || null,
        country: country || null,
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Create user profile in users table
    const { error: profileError } = await supabaseServer
      .from('users')
      .insert({
        id: authData.user.id,
        email: sanitizedEmail,
        full_name: sanitizedFullName,
        institution: institution || null,
        research_field: researchField || null,
        country: country || null,
        total_points: 0,
        role: 'researcher'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Rollback: delete auth user if profile creation fails
      await supabaseServer.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: 'Failed to complete registration. Please try again.' },
        { status: 500 }
      );
    }

    console.log('User profile created');

    // Award signup bonus points
    const { error: pointsError } = await supabaseServer
      .from('points_transactions')
      .insert({
        user_id: authData.user.id,
        points: 100,
        transaction_type: 'bonus',
        description: 'Welcome bonus for new user',
        metadata: { source: 'signup' }
      });

    if (pointsError) {
      console.error('Points award error:', pointsError);
      // Don't fail signup if points fail, just log it
    } else {
      console.log('Welcome bonus awarded: 100 points');
    }

    // Log successful signup (without sensitive data)
    console.log(`✅ New user registered: ${authData.user.id}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully. You can now log in.',
        userId: authData.user.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// Cleanup old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, attempt] of signupAttempts.entries()) {
      if (now > attempt.resetAt) {
        signupAttempts.delete(ip);
      }
    }
  }, 60 * 1000); // Every minute
}