// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
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

    console.log('Signup attempt for:', email);

    // Create user with admin client (auto-confirm email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for hackathon
      user_metadata: {
        full_name: fullName || email,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      
      // Handle duplicate email
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
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
    console.log('User created in auth:', userId);

    // The database trigger will automatically:
    // 1. Create user profile in users table
    // 2. Award 100 welcome points
    // 3. Create points transaction record
    
    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify user profile was created
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, total_points')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile verification error:', profileError);
      // Profile creation failed, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Profile verified:', profile);

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
      message: 'Account created successfully! You earned 100 points!',
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
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