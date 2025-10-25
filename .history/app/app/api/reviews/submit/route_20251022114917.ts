// app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1️⃣ AUTH CHECK
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      datasetId,
      accuracyRating,
      completenessRating,
      relevanceRating,
      methodologyRating,
      feedback,
      recommendation, // 'approve' | 'reject' | 'needs_improvement'
    } = body;

    // 2️⃣ VALIDATION
    if (
      !datasetId ||
      !accuracyRating ||
      !completenessRating ||
      !relevanceRating ||
      !methodologyRating ||
      !recommendation
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const ratings = [
      accuracyRating,
      completenessRating,
      relevanceRating,
      methodologyRating,
    ];

    if (ratings.some((r) => r < 1 || r > 5)) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 5' },
        { status: 400 }
      );
    }

    // 3️⃣ PREVENT DUPLICATE REVIEW
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('reviewer_id', session.user.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this dataset' },
        { status: 400 }
      );
    }

    // 4️⃣ GET DATASET INFO
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (datasetError || !dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }

    // Prevent self-review
    if (dataset.uploader_id === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own dataset' },
        { status: 400 }
      );
    }

    // 5️⃣ CALCULATE HUMAN REVIEW SCORE (0–100)
    const humanScore =
      ((accuracyRating +
        completenessRating +
        relevanceRating +
        methodologyRating) /
        4 /
        5) *
      100;

    // 6️⃣ INSERT REVIEW
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        dataset_id: datasetId,
        reviewer_id: session.user.id,
        accuracy_rating: accuracyRating,
        completeness_rating: completenessRating,
        relevance_rating: relevanceRating,
        methodology_rating: methodologyRating,
        human_score: humanScore,
        feedback,
        recommendation,
        status: 'active',
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

    // 7️⃣ AWARD REVIEWER POINTS (+20)
    const reviewPoints = 20;
    const { error: reviewerRewardError } = await supabase.rpc('award_points', {
      user_id: session.user.id,
      points: reviewPoints,
      action: 'review',
      description: `Reviewed dataset: ${dataset.title}`,
    });

    if (reviewerRewardError)
      console.error('Reviewer reward error:', reviewerRewardError);

    // 8️⃣ RECALCULATE FINAL DATASET SCORE
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('human_score')
      .eq('dataset_id', datasetId);

      const avgHumanScore = allReviews && allReviews.length > 0
  ? allReviews.reduce((sum, r) => sum + (r.human_score || 0), 0) / allReviews.length
  : humanScore;


    const aiScore = dataset.ai_confidence_score || dataset.quality_score || 0;
    const finalScore = Math.round(aiScore * 0.4 + avgHumanScore * 0.6);

    const isVerified = finalScore >= 70;

    // Update dataset
    const { error: updateError } = await supabase
      .from('datasets')
      .update({
        final_verification_score: finalScore,
        human_verification_score: avgHumanScore,
        total_reviews: allReviews?.length || 1,
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        status: isVerified ? 'verified' : 'pending_review',
      })
      .eq('id', datasetId);

    if (updateError) {
      console.error('Dataset update error:', updateError);
    }

    // 9️⃣ AWARD UPLOADER BONUS IF VERIFIED (+200)
    if (isVerified) {
      const { error: uploaderRewardError } = await supabase.rpc(
        'award_points',
        {
          user_id: dataset.uploader_id,
          points: 200,
          action: 'verification',
          description: `Dataset verified: ${dataset.title}`,
        }
      );

      if (uploaderRewardError)
        console.error('Uploader verification reward error:', uploaderRewardError);
    }

    // 🔟 FETCH UPDATED USER POINTS
    const { data: reviewerProfile } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', session.user.id)
      .single();

    // ✅ SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      review,
      dataset: {
        id: dataset.id,
        title: dataset.title,
        aiScore,
        humanScore: avgHumanScore,
        finalScore,
        verified: isVerified,
      },
      rewards: {
        reviewerPoints: reviewPoints,
        newTotalPoints: reviewerProfile?.total_points || 0,
        uploaderBonus: isVerified ? 200 : 0,
      },
      message: isVerified
        ? `✅ Review submitted. Dataset verified! You earned ${reviewPoints} points.`
        : `✅ Review submitted successfully. You earned ${reviewPoints} points.`,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ✅ GET endpoint to fetch all reviews for a dataset
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const datasetId = searchParams.get('datasetId');

    if (!datasetId) {
      return NextResponse.json(
        { error: 'Dataset ID required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(
        `
        *,
        reviewer:users!reviews_reviewer_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq('dataset_id', datasetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch reviews error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      totalReviews: reviews.length,
      avgAccuracy:
        reviews.reduce((sum, r) => sum + r.accuracy_rating, 0) /
          reviews.length || 0,
      avgCompleteness:
        reviews.reduce((sum, r) => sum + r.completeness_rating, 0) /
          reviews.length || 0,
      avgRelevance:
        reviews.reduce((sum, r) => sum + r.relevance_rating, 0) /
          reviews.length || 0,
      avgMethodology:
        reviews.reduce((sum, r) => sum + r.methodology_rating, 0) /
          reviews.length || 0,
      recommendations: {
        approve: reviews.filter((r) => r.recommendation === 'approve').length,
        reject: reviews.filter((r) => r.recommendation === 'reject').length,
        needs_improvement: reviews.filter(
          (r) => r.recommendation === 'needs_improvement'
        ).length,
      },
    };

    return NextResponse.json({
      success: true,
      reviews,
      stats,
    });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
