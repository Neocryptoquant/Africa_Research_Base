// 0xAbim: User signup route using standard Supabase auth (no admin key required)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 0xAbim: Use public anon key for user signup (standard auth flow)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // 0xAbim: Log signup attempt in development only
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Signup] Signup attempt for:', email);
    }

    // 0xAbim: Create user with regular signup (no admin privileges needed)
    // Note: If email confirmation is enabled in Supabase, user will receive confirmation email
    // To disable: Supabase Dashboard → Authentication → Email Auth → Disable "Enable email confirmations"
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email,
        },
        // 0xAbim: Email confirmation can be disabled in Supabase settings for faster signup
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (authError) {
      // 0xAbim: Log auth errors in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Signup] Auth creation error:', authError);
      }

      // Handle duplicate email
      if (authError.message.includes('already registered') || authError.message.includes('already exists') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // 0xAbim: Log user creation in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Signup] User created in auth:', userId);
    }

    // 0xAbim: Create user profile in database manually
    // (Database triggers may not be set up yet, so we create the profile explicitly)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: authData.user.email!,
        full_name: fullName || email.split('@')[0], // Use email username as fallback
        total_points: 100, // Welcome bonus
        role: 'researcher',
      })
      .select('id, email, full_name, total_points')
      .single();

    if (profileError) {
      // 0xAbim: Log profile creation error in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Signup] Profile creation error:', profileError);
      }

      // 0xAbim: If profile already exists (from trigger), fetch it instead
      if (profileError.code === '23505') { // Duplicate key error
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, email, full_name, total_points')
          .eq('id', userId)
          .single();

        if (existingProfile) {
          // Profile exists, continue with signup
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Signup] Profile already exists:', existingProfile);
          }

          return NextResponse.json({
            success: true,
            user: {
              id: authData.user.id,
              email: authData.user.email,
              fullName: existingProfile.full_name,
            },
            rewards: {
              welcomePoints: 100,
              totalPoints: existingProfile.total_points || 100,
              message: 'Welcome! You\'ve received 100 bonus points!'
            },
            message: 'Account created successfully! Please check your email to confirm your account.',
          }, { status: 201 });
        }
      }

      // Profile creation failed
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // 0xAbim: Award welcome points
    await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: 100,
        transaction_type: 'bonus',
        description: 'Welcome bonus for new account',
        metadata: { type: 'signup_bonus' }
      });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Signup] Profile created:', profile);
    }

    // 0xAbim: Return success response with user data
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: profile?.full_name || fullName,
      },
      rewards: {
        welcomePoints: 100,
        totalPoints: profile?.total_points || 100,
        message: 'Welcome! You\'ve received 100 bonus points!'
      },
      // 0xAbim: Message depends on email confirmation settings
      message: authData.session
        ? 'Account created successfully! You earned 100 points!'
        : 'Account created! Please check your email to confirm your account.',
    }, { status: 201 });

  } catch (error) {
    // 0xAbim: Log errors in development only
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Signup] Signup error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Signup endpoint - use POST to create account',
    welcomeBonus: 100,
    requirements: {
      email: 'Valid email address',
      password: 'Minimum 8 characters',
      fullName: 'Your full name (optional)'
    }
  });
}