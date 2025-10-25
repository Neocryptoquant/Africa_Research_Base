// app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
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

    // Validation
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

    // Validate ratings (1-5 scale)
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

    // Check if user already reviewed this dataset
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('dataset_id', datasetId)
      .eq('reviewer_id', session.user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this dataset' },
        { status: 400 }
      );
    }

    // Get dataset info
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
    if (dataset.user_id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot review your own dataset' },
        { status: 400 }
      );
    }

    // Calculate human review score (average of ratings, scaled to 100)
    const humanScore =
      ((accuracyRating +
        completenessRating +
        relevanceRating +
        methodologyRating) /
        4 /
        5) *
      100;

    // Create review record
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
      console.error('Review creation error:', reviewError);
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    // Award review points (20 base points)
    const reviewPoints = 20;
    await supabase.rpc('add_user_points', {
      p_user_id: session.user.id,
      p_points: reviewPoints,
      p_action: 'review',
      p_description: `Reviewed: ${dataset.title}`,
    });

    // Calculate final score (40% AI + 60% Human average)
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('human_score')
      .eq('dataset_id', datasetId);

    if (allReviews && allReviews.length > 0) {
      const avgHumanScore =
        allReviews.reduce((sum, r) => sum + r.human_score, 0) /
        allReviews.length;
      const finalScore =
        dataset.ai_quality_score * 0.4 + avgHumanScore * 0.6;

      // Update dataset with final score
      const { error: updateError } = await supabase
        .from('datasets')
        .update({
          final_score: Math.round(finalScore),
          review_count: allReviews.length,
          verification_status:
            finalScore >= 70 ? 'verified' : 'pending_review',
        })
        .eq('id', datasetId);

      if (!updateError && finalScore >= 70) {
        // Award verification bonus to uploader (200 points)
        await supabase.rpc('add_user_points', {
          p_user_id: dataset.user_id,
          p_points: 200,
          p_action: 'verification',
          p_description: `Dataset verified: ${dataset.title}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      review,
      pointsEarned: reviewPoints,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch reviews for a dataset
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

    // Calculate statistics
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