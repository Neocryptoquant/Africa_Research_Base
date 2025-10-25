// app/api/reviews/submit/route.ts (UPDATED with $ARB rewards)
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
      rating, 
      feedback, 
      qualityMetrics,
      isApproved,
      verificationNotes 
    } = body;

    // Validate inputs
    if (!datasetId || rating === undefined) {
      return NextResponse.json({ error: 'Dataset ID and rating are required' }, { status: 400 });
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 0 and 5' }, { status: 400 });
    }

    console.log(`Review submission - User: ${user.id}, Dataset: ${datasetId}, Rating: ${rating}`);

    // Check if dataset exists
    const { data: dataset, error: datasetError } = await supabaseServer!
      .from('datasets')
      .select('id, uploader_id, ai_confidence_score, total_reviews, human_verification_score')
      .eq('id', datasetId)
      .single();

    if (datasetError || !dataset) {
      console.error('Dataset not found:', datasetError);
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Prevent self-review
    if (dataset.uploader_id === user.id) {
      return NextResponse.json({ error: 'You cannot review your own dataset' }, { status: 403 });
    }

    // Check if user already reviewed this dataset
    const { data: existingReview } = await supabaseServer!
      .from('reviews')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this dataset' }, { status: 409 });
    }

    // Insert review
    const { data: review, error: reviewError } = await supabaseServer!
      .from('reviews')
      .insert({
        dataset_id: datasetId,
        reviewer_id: user.id,
        rating: rating,
        feedback: feedback || null,
        quality_metrics: qualityMetrics || null,
        is_approved: isApproved !== undefined ? isApproved : null,
        verification_notes: verificationNotes || null
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    console.log('Review inserted:', review.id);

    // Calculate new human verification score
    const { data: allReviews, error: reviewsFetchError } = await supabaseServer!
      .from('reviews')
      .select('rating')
      .eq('dataset_id', datasetId);

    if (reviewsFetchError) {
      console.error('Failed to fetch reviews:', reviewsFetchError);
    }

    const totalReviews = allReviews?.length || 0;
const averageRating =
  totalReviews > 0
    ? (allReviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews)
    : 0;
const humanScore = (averageRating / 5) * 100;


    // Calculate final score (40% AI + 60% Human)
    const aiScore = dataset.ai_confidence_score || 0;
    const finalScore = (aiScore * 0.4) + (humanScore * 0.6);
    const isVerified = finalScore >= 70;
    const wasNotVerifiedBefore = dataset.total_reviews === 0 || !dataset.human_verification_score;

    console.log('Score calculation:', {
      aiScore,
      humanScore,
      finalScore,
      totalReviews,
      isVerified
    });

    // Update dataset with new scores
    const { error: updateError } = await supabaseServer!
      .from('datasets')
      .update({
        human_verification_score: humanScore,
        total_reviews: totalReviews,
        final_verification_score: finalScore,
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        status: isVerified ? 'verified' : 'under_review'
      })
      .eq('id', datasetId);

    if (updateError) {
      console.error('Dataset update error:', updateError);
    }

    // 🪙 Award $ARB tokens to reviewer
    const { data: reviewerProfile } = await supabaseServer!
      .from('users')
      .select('wallet_address')
      .eq('id', user.id)
      .single();

    const reviewReward = REWARD_AMOUNTS.REVIEW_SUBMITTED;
    let reviewerTokenSuccess = false;
    let reviewerTxSignature = null;

    if (reviewerProfile?.wallet_address) {
      try {
        const reviewerPublicKey = new PublicKey(reviewerProfile.wallet_address);
        reviewerTxSignature = await arbTokenService.transferTokens(
          reviewerPublicKey,
          reviewReward,
          `Review submitted for dataset`
        );
        reviewerTokenSuccess = true;
        console.log(`✅ Awarded ${reviewReward} $ARB to reviewer ${user.id}`);
      } catch (tokenError) {
        console.error('Reviewer token transfer failed:', tokenError);
      }
    }

    // Record reviewer reward
    const { error: reviewerPointsError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: user.id,
        points: reviewReward,
        transaction_type: 'review_submitted',
        dataset_id: datasetId,
        review_id: review.id,
        description: `Review submitted for dataset`,
        metadata: { 
          rating, 
          final_score: finalScore,
          human_score: humanScore,
          ai_score: aiScore,
          token_transferred: reviewerTokenSuccess,
          transaction_signature: reviewerTxSignature
        }
      });

    if (reviewerPointsError) {
      console.error('Reviewer points error:', reviewerPointsError);
    }

    // 🎉 If dataset just became verified, award bonus to uploader
    let uploaderBonusSuccess = false;
    let uploaderTxSignature = null;

    if (isVerified && wasNotVerifiedBefore) {
      const bonusReward = REWARD_AMOUNTS.DATASET_VERIFIED;
      
      const { data: uploaderProfile } = await supabaseServer!
        .from('users')
        .select('wallet_address')
        .eq('id', dataset.uploader_id)
        .single();

      if (uploaderProfile?.wallet_address) {
        try {
          const uploaderPublicKey = new PublicKey(uploaderProfile.wallet_address);
          uploaderTxSignature = await arbTokenService.transferTokens(
            uploaderPublicKey,
            bonusReward,
            'Dataset verified by community'
          );
          uploaderBonusSuccess = true;
          console.log(`✅ Awarded ${bonusReward} $ARB verification bonus to uploader`);
        } catch (tokenError) {
          console.error('Uploader bonus transfer failed:', tokenError);
        }
      }

      // Record uploader bonus
      const { error: bonusError } = await supabaseServer!
        .from('points_transactions')
        .insert({
          user_id: dataset.uploader_id,
          points: bonusReward,
          transaction_type: 'dataset_verification',
          dataset_id: datasetId,
          description: 'Dataset verified by community',
          metadata: { 
            final_score: finalScore,
            total_reviews: totalReviews,
            token_transferred: uploaderBonusSuccess,
            transaction_signature: uploaderTxSignature
          }
        });

      if (bonusError) {
        console.error('Bonus error:', bonusError);
      }
    }

    // Get updated reviewer balance
    let reviewerBalance = 0;
    if (reviewerProfile?.wallet_address) {
      try {
        const reviewerPublicKey = new PublicKey(reviewerProfile.wallet_address);
        reviewerBalance = await arbTokenService.getTokenBalance(reviewerPublicKey);
      } catch (error) {
        console.error('Failed to get reviewer balance:', error);
      }
    }

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        arbTokensEarned: reviewReward,
        tokenTransferred: reviewerTokenSuccess,
        transactionSignature: reviewerTxSignature
      },
      dataset: {
        aiScore,
        humanScore: Math.round(humanScore * 100) / 100,
        finalScore: Math.round(finalScore * 100) / 100,
        totalReviews,
        isVerified,
        status: isVerified ? 'verified' : 'under_review'
      },
      reviewer: {
        arbBalance: reviewerBalance,
        walletAddress: reviewerProfile?.wallet_address || null
      },
      uploaderBonus: isVerified && wasNotVerifiedBefore ? {
        awarded: uploaderBonusSuccess,
        amount: REWARD_AMOUNTS.DATASET_VERIFIED,
        transactionSignature: uploaderTxSignature
      } : null,
      message: reviewerTokenSuccess 
        ? `🎉 Review submitted! You earned ${reviewReward} $ARB tokens!${isVerified && wasNotVerifiedBefore ? ` The uploader received ${REWARD_AMOUNTS.DATASET_VERIFIED} $ARB bonus!` : ''}`
        : 'Review submitted! Token transfer will be retried.'
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}