// app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

// Points rewards for reviews
const REVIEW_POINTS = {
  BASE_REVIEW: 20,              // Base points per review
  VERIFICATION_BONUS: 200,      // Bonus when dataset gets verified
  DETAILED_REVIEW: 10,          // Bonus for detailed feedback
  FIRST_REVIEW: 30,             // First review bonus
};

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
      return NextResponse.json(
        { error: 'Dataset ID and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 0 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 0 and 5' },
        { status: 400 }
      );
    }

    console.log(`Review submission - User: ${user.id}, Dataset: ${datasetId}, Rating: ${rating}`);

    // Check if dataset exists
    const { data: dataset, error: datasetError } = await supabaseServer!
      .from('datasets')
      .select('id, uploader_id, ai_confidence_score, total_reviews, human_verification_score, is_verified')
      .eq('id', datasetId)
      .single();

    if (datasetError || !dataset) {
      console.error('Dataset not found:', datasetError);
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
    }

    // Prevent self-review
    if (dataset.uploader_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own dataset' },
        { status: 403 }
      );
    }

    // Check if user already reviewed this dataset
    const { data: existingReview } = await supabaseServer!
      .from('reviews')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('reviewer_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this dataset' },
        { status: 409 }
      );
    }

    // Check if this is user's first review
    const { count: reviewCount } = await supabaseServer!
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('reviewer_id', user.id);

    const isFirstReview = (reviewCount || 0) === 0;

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
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
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

   const totalReviews = allReviews?.length ?? 0;
const averageRating = totalReviews
  ? allReviews!.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews
  : 0;
const humanScore = (averageRating / 5) * 100;


    // Calculate final score (40% AI + 60% Human)
    const aiScore = dataset.ai_confidence_score || 0;
    const finalScore = (aiScore * 0.4) + (humanScore * 0.6);
    const isVerified = finalScore >= 70;
    const wasNotVerifiedBefore = !dataset.is_verified;

    console.log('Score calculation:', {
      aiScore,
      humanScore,
      finalScore,
      totalReviews,
      isVerified,
      wasNotVerifiedBefore
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
    } else {
      console.log('Dataset scores updated in database');
    }

    // Calculate reviewer points
    let reviewerPoints = REVIEW_POINTS.BASE_REVIEW;
    const pointsBreakdown: Record<string, number> = {
      base: REVIEW_POINTS.BASE_REVIEW
    };

    // Detailed feedback bonus
    if (feedback && feedback.length > 100) {
      reviewerPoints += REVIEW_POINTS.DETAILED_REVIEW;
      pointsBreakdown.detailedFeedback = REVIEW_POINTS.DETAILED_REVIEW;
    }

    // First review bonus
    if (isFirstReview) {
      reviewerPoints += REVIEW_POINTS.FIRST_REVIEW;
      pointsBreakdown.firstReview = REVIEW_POINTS.FIRST_REVIEW;
    }

    // Award points to reviewer
    const { error: reviewerPointsError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: user.id,
        points: reviewerPoints,
        transaction_type: 'review_submitted',
        dataset_id: datasetId,
        review_id: review.id,
        description: `Review submitted for dataset`,
        metadata: { 
          rating, 
          final_score: finalScore,
          human_score: humanScore,
          ai_score: aiScore,
          breakdown: pointsBreakdown,
          is_first_review: isFirstReview
        }
      });

    if (reviewerPointsError) {
      console.error('Reviewer points error:', reviewerPointsError);
    } else {
      console.log(`Awarded ${reviewerPoints} points to reviewer ${user.id}`);
    }

    // If dataset just became verified, award bonus to uploader
    let uploaderBonusAwarded = false;
    if (isVerified && wasNotVerifiedBefore) {
      const bonusPoints = REVIEW_POINTS.VERIFICATION_BONUS;
      
      const { error: bonusError } = await supabaseServer!
        .from('points_transactions')
        .insert({
          user_id: dataset.uploader_id,
          points: bonusPoints,
          transaction_type: 'dataset_verification',
          dataset_id: datasetId,
          description: 'Dataset verified by community',
          metadata: { 
            final_score: finalScore,
            total_reviews: totalReviews,
            triggered_by_review: review.id
          }
        });

      if (bonusError) {
        console.error('Uploader bonus error:', bonusError);
      } else {
        console.log(`Awarded ${bonusPoints} verification bonus to uploader ${dataset.uploader_id}`);
        uploaderBonusAwarded = true;
      }
    }

    // Get updated reviewer points
    const { data: reviewerProfile } = await supabaseServer!
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single();

    // Return success response
    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        pointsEarned: reviewerPoints,
        breakdown: pointsBreakdown
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
        totalPoints: reviewerProfile?.total_points || 0
      },
      uploaderBonus: uploaderBonusAwarded ? {
        awarded: true,
        points: REVIEW_POINTS.VERIFICATION_BONUS
      } : null,
      message: `Review submitted! You earned ${reviewerPoints} points!${
        uploaderBonusAwarded ? ` The uploader received ${REVIEW_POINTS.VERIFICATION_BONUS} points verification bonus!` : ''
      }`
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// Get pending datasets for review
export async function GET(request: NextRequest) {
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

    console.log(`Fetching pending reviews for user: ${user.id}`);

    // Get datasets that need review (exclude user's own and already reviewed)
    const { data: datasets, error } = await supabaseServer!
      .from('datasets')
      .select(`
        id,
        title,
        description,
        research_field,
        tags,
        file_name,
        file_size,
        row_count,
        column_count,
        quality_score,
        ai_confidence_score,
        human_verification_score,
        final_verification_score,
        total_reviews,
        status,
        is_verified,
        created_at,
        uploader:users!uploader_id(
          full_name,
          institution,
          research_field
        )
      `)
      .in('status', ['ai_verified', 'under_review'])
      .neq('uploader_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch datasets error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch datasets' },
        { status: 500 }
      );
    }

    // Get all reviews by current user
    const { data: userReviews, error: reviewsError } = await supabaseServer!
      .from('reviews')
      .select('dataset_id')
      .eq('reviewer_id', user.id);

    if (reviewsError) {
      console.error('Fetch user reviews error:', reviewsError);
    }

    const reviewedDatasetIds = new Set(userReviews?.map(r => r.dataset_id) || []);

    // Filter out already reviewed datasets
    const pendingDatasets = datasets?.filter(dataset => 
      !reviewedDatasetIds.has(dataset.id)
    ) || [];

    console.log(`Found ${pendingDatasets.length} pending datasets for review`);

    // Get reviewer's current stats
    const { data: reviewerStats } = await supabaseServer!
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single();

    const { count: totalReviewsCount } = await supabaseServer!
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_id', user.id);

    return NextResponse.json({
      success: true,
      datasets: pendingDatasets,
      stats: {
        pendingCount: pendingDatasets.length,
        totalPoints: reviewerStats?.total_points || 0,
        reviewsSubmitted: totalReviewsCount || 0,
        pointsPerReview: REVIEW_POINTS.BASE_REVIEW
      },
      rewards: REVIEW_POINTS
    });

  } catch (error) {
    console.error('Pending reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}