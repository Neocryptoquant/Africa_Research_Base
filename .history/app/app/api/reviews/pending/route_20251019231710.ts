import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

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

    // Get datasets that need review
    // Exclude: datasets uploaded by current user
    // Exclude: datasets already reviewed by current user
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
          avatar_url,
          research_field
        )
      `)
      .in('status', ['ai_verified', 'under_review'])
      .neq('uploader_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50); // Get more, we'll filter client-side

    if (error) {
      console.error('Fetch datasets error:', error);
      return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
    }

    // Get all reviews by current user to filter out
    const { data: userReviews, error: reviewsError } = await supabaseServer!
      .from('reviews')
      .select('dataset_id')
      .eq('reviewer_id', user.id);

    if (reviewsError) {
      console.error('Fetch user reviews error:', reviewsError);
    }

    const reviewedDatasetIds = new Set(userReviews?.map(r => r.dataset_id) || []);

    // Filter out datasets already reviewed by current user
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
        pointsPerReview: 20
      }
    });

  } catch (error) {
    console.error('Pending reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}