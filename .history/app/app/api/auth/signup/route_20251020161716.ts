// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase';
import { arbTokenService, REWARD_AMOUNTS } from '@/lib/arbToken';
import { PublicKey } from '@solana/web3.js';

// Rate limiting map
const signupAttempts = new Map<string, { count: number; resetTime: number }>();

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
  country: z.string().optional(),
  walletAddress: z.string().optional() // Solana wallet for $ARB rewards
});

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

  try {
    // Rate limiting
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

    const { email, password, fullName, institution, researchField, country, walletAddress } = validatedData;

    console.log('Signup attempt for:', email);

    // Check for duplicate email
    const { data: existingUser } = await supabaseServer!
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseServer!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          institution: institution || null,
          research_field: researchField || null,
          country: country || null,
          wallet_address: walletAddress || null
        }
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

    // Create user profile
    const { error: profileError } = await supabaseServer!
      .from('users')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        institution: institution || null,
        research_field: researchField || null,
        country: country || null,
        wallet_address: walletAddress || null,
        total_points: 0 // Will be updated after token transfer
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Rollback auth user if profile creation fails
      await supabaseServer!.auth.admin.deleteUser(userId);
      throw profileError;
    }

    console.log('User profile created');

    // 🪙 Award signup bonus $ARB tokens
    let tokenTransferSuccess = false;
    let transactionSignature = null;

    if (walletAddress) {
      try {
        const userPublicKey = new PublicKey(walletAddress);
        transactionSignature = await arbTokenService.transferTokens(
          userPublicKey,
          REWARD_AMOUNTS.SIGNUP_BONUS,
          'Signup bonus'
        );
        tokenTransferSuccess = true;
        console.log(`Awarded ${REWARD_AMOUNTS.SIGNUP_BONUS} $ARB to ${walletAddress}`);
      } catch (tokenError) {
        console.error('Token transfer failed:', tokenError);
        // Don't fail signup if token transfer fails
      }
    }

    // Record transaction in database
    const { error: txError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: userId,
        points: REWARD_AMOUNTS.SIGNUP_BONUS,
        transaction_type: 'signup_bonus',
        description: 'Welcome bonus for joining Africa Research Base',
        metadata: {
          token_transferred: tokenTransferSuccess,
          transaction_signature: transactionSignature,
          wallet_address: walletAddress || null
        }
      });

    if (txError) {
      console.error('Transaction record error:', txError);
    }

    // Update rate limiting
    const currentAttempts = signupAttempts.get(clientIp);
    signupAttempts.set(clientIp, {
      count: (currentAttempts?.count || 0) + 1,
      resetTime: now + (15 * 60 * 1000) // 15 minutes
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        fullName,
        institution,
        researchField,
        country,
        walletAddress
      },
      rewards: {
        arbTokens: tokenTransferSuccess ? REWARD_AMOUNTS.SIGNUP_BONUS : 0,
        tokenTransferred: tokenTransferSuccess,
        transactionSignature,
        message: tokenTransferSuccess 
          ? `${REWARD_AMOUNTS.SIGNUP_BONUS} $ARB tokens sent to your wallet!`
          : walletAddress 
            ? 'Signup successful! Token transfer will be retried.'
            : 'Signup successful! Connect your wallet to receive $ARB tokens.'
      },
      message: 'Account created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
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
    message: 'Signup endpoint',
    rewardInfo: {
      signupBonus: `${REWARD_AMOUNTS.SIGNUP_BONUS} $ARB`,
      uploadReward: `${REWARD_AMOUNTS.DATASET_UPLOAD} $ARB`,
      reviewReward: `${REWARD_AMOUNTS.REVIEW_SUBMITTED} $ARB`,
      verificationBonus: `${REWARD_AMOUNTS.DATASET_VERIFIED} $ARB`
    }
  });
}