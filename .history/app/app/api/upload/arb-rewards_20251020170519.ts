import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { arbTokenService, REWARD_AMOUNTS } from '@/lib/arbToken';
import { PublicKey } from '@solana/web3.js';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer!.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      datasetId, 
      qualityScore, 
      fileSize,
      fileName 
    } = body;

    if (!datasetId || qualityScore === undefined) {
      return NextResponse.json(
        { error: 'Dataset ID and quality score are required' },
        { status: 400 }
      );
    }

    console.log(`Processing upload rewards for dataset: ${datasetId}, Quality: ${qualityScore}`);

    // Get user's wallet address
    const { data: userProfile } = await supabaseServer!
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    if (!userProfile?.wallet_address) {
      return NextResponse.json({
        success: false,
        error: 'No wallet connected. Please connect your wallet to receive $ARB rewards.',
        rewardsEarned: 0
      }, { status: 400 });
    }

    // Calculate rewards
    let totalReward = REWARD_AMOUNTS.DATASET_UPLOAD;
    const bonuses: string[] = [`Upload: ${REWARD_AMOUNTS.DATASET_UPLOAD} $ARB`];

    // High quality bonus (90+ quality score)
    if (qualityScore >= 90) {
      totalReward += REWARD_AMOUNTS.HIGH_QUALITY_BONUS;
      bonuses.push(`High Quality Bonus: ${REWARD_AMOUNTS.HIGH_QUALITY_BONUS} $ARB`);
    }

    // Transfer $ARB tokens
    let tokenTransferSuccess = false;
    let transactionSignature = null;

    try {
      const userPublicKey = new PublicKey(userProfile.wallet_address);
      transactionSignature = await arbTokenService.transferTokens(
        userPublicKey,
        totalReward,
        `Dataset upload: ${fileName || datasetId}`
      );
      tokenTransferSuccess = true;
      console.log(`✅ Transferred ${totalReward} $ARB to ${userProfile.wallet_address}`);
    } catch (tokenError) {
      console.error('Token transfer failed:', tokenError);
    }

    // Record transaction
    const { error: txError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: user.id,
        points: totalReward,
        transaction_type: 'dataset_upload',
        dataset_id: datasetId,
        description: `Uploaded dataset: ${fileName || datasetId}`,
        metadata: {
          quality_score: qualityScore,
          file_size: fileSize,
          bonuses,
          token_transferred: tokenTransferSuccess,
          transaction_signature: transactionSignature,
          wallet_address: userProfile.wallet_address
        }
      });

    if (txError) {
      console.error('Failed to record transaction:', txError);
    }

    // Get user's new balance
    let newBalance = 0;
    try {
      const userPublicKey = new PublicKey(userProfile.wallet_address);
      newBalance = await arbTokenService.getTokenBalance(userPublicKey);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }

    return NextResponse.json({
      success: true,
      rewards: {
        arbTokensEarned: totalReward,
        bonuses,
        tokenTransferred: tokenTransferSuccess,
        transactionSignature,
        newBalance,
        explorerUrl: transactionSignature 
          ? `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
          : null
      },
      message: tokenTransferSuccess
        ? `🎉 You earned ${totalReward} $ARB tokens!`
        : 'Upload recorded! Token transfer will be retried.'
    });

  } catch (error) {
    console.error('Upload rewards error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload rewards' },
      { status: 500 }
    );
  }
}

// Get user's pending rewards
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer!.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet and balance
    const { data: userProfile } = await supabaseServer!
      .from('users')
      .select('wallet_address, total_points')
      .eq('id', user.id)
      .single();

    let actualBalance = 0;
    if (userProfile?.wallet_address) {
      try {
        const userPublicKey = new PublicKey(userProfile.wallet_address);
        actualBalance = await arbTokenService.getTokenBalance(userPublicKey);
      } catch (error) {
        console.error('Failed to get token balance:', error);
      }
    }

    // Get transaction history
    const { data: transactions } = await supabaseServer!
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      balance: {
        actual: actualBalance,
        database: userProfile?.total_points || 0,
        walletAddress: userProfile?.wallet_address || null
      },
      recentTransactions: transactions || [],
      rewardRates: REWARD_AMOUNTS
    });

  } catch (error) {
    console.error('Get rewards error:', error);
    return NextResponse.json(
      { error: 'Failed to get rewards data' },
      { status: 500 }
    );
  }
}