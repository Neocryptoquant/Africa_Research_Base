// app/api/reviews/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { datasetId, accuracyRating, completenessRating, relevanceRating, methodologyRating, feedback, recommendation } = body;

    if (!datasetId || !accuracyRating || !completenessRating || !relevanceRating || !methodologyRating || !recommendation)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const ratings = [accuracyRating, completenessRating, relevanceRating, methodologyRating];
    if (ratings.some((r) => r < 1 || r > 5))
      return NextResponse.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 });

    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single();

    if (datasetError || !dataset)
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });

    if (dataset.uploader_id === session.user.id)
      return NextResponse.json({ error: 'Cannot review your own dataset' }, { status: 400 });

    // Calculate review score
    const humanScore = ((accuracyRating + completenessRating + relevanceRating + methodologyRating) / 4 / 5) * 100;

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
      console.error('Review insert error:', reviewError);
      return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
    }

    // ✅ Award reviewer points
    const reviewPoints = 20;
    await supabase.rpc('award_points', {
      user_id: session.user.id,
      points: reviewPoints,
      action: 'review',
      description: `Reviewed: ${dataset.title}`,
    });

    // Compute final dataset score
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('human_score')
      .eq('dataset_id', datasetId);

    const avgHuman = allReviews?.length
      ? allReviews.reduce((s, r) => s + r.human_score, 0) / allReviews.length
      : humanScore;
    const finalScore = dataset.ai_confidence_score * 0.4 + avgHuman * 0.6;

    await supabase
      .from('datasets')
      .update({
        final_verification_score: finalScore,
        total_reviews: allReviews?.length || 1,
        is_verified: finalScore >= 70,
        verified_at: finalScore >= 70 ? new Date().toISOString() : null,
      })
      .eq('id', datasetId);

    // ✅ If dataset verified, reward uploader
    if (finalScore >= 70) {
      await supabase.rpc('award_points', {
        user_id: dataset.uploader_id,
        points: 200,
        action: 'verification',
        description: `Dataset verified: ${dataset.title}`,
      });
    }

    return NextResponse.json({
      success: true,
      review,
      pointsEarned: reviewPoints,
      message: `Review successful! You earned ${reviewPoints} points.`,
    });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
