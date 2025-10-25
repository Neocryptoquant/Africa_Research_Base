/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/datasets/share/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for public access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Get dataset by share token
    const { data: dataset, error } = await supabase
      .from('datasets')
      .select(
        `
        *,
        uploader:users!datasets_user_id_fkey(
          id,
          full_name,
          email,
          affiliation,
          reputation_score
        ),
        reviews(
          id,
          accuracy_rating,
          completeness_rating,
          relevance_rating,
          methodology_rating,
          human_score,
          feedback,
          recommendation,
          created_at,
          reviewer:users!reviews_reviewer_id_fkey(
            full_name,
            affiliation
          )
        )
      `
      )
      .eq('share_token', token)
      .eq('is_public', true)
      .eq('status', 'active')
      .single();

    if (error || !dataset) {
      return NextResponse.json(
        { error: 'Dataset not found or not public' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabase
      .from('datasets')
      .update({ view_count: (dataset.view_count || 0) + 1 })
      .eq('id', dataset.id);

    // Calculate statistics
    const reviewStats = {
      totalReviews: dataset.reviews.length,
      avgAccuracy:
        dataset.reviews.reduce((sum: number, r: any) => sum + r.accuracy_rating, 0) /
          dataset.reviews.length || 0,
      avgCompleteness:
        dataset.reviews.reduce((sum: number, r: any) => sum + r.completeness_rating, 0) /
          dataset.reviews.length || 0,
      avgRelevance:
        dataset.reviews.reduce((sum: number, r: any) => sum + r.relevance_rating, 0) /
          dataset.reviews.length || 0,
      avgMethodology:
        dataset.reviews.reduce((sum: number, r: any) => sum + r.methodology_rating, 0) /
          dataset.reviews.length || 0,
      recommendations: {
        approve: dataset.reviews.filter((r: any) => r.recommendation === 'approve')
          .length,
        reject: dataset.reviews.filter((r: any) => r.recommendation === 'reject')
          .length,
        needs_improvement: dataset.reviews.filter(
          (r: any) => r.recommendation === 'needs_improvement'
        ).length,
      },
    };

    return NextResponse.json({
      dataset,
      reviewStats,
      shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/share/${token}`,
    });
  } catch (error) {
    console.error('Share fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to toggle public sharing
export async function POST(req: NextRequest) {
  try {
    const { datasetId, isPublic } = await req.json();

    if (!datasetId || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Update dataset
    const { data, error } = await supabase
      .from('datasets')
      .update({ 
        is_public: isPublic,
        published_at: isPublic ? new Date().toISOString() : null 
      })
      .eq('id', datasetId)
      .select('share_token')
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update sharing settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareUrl: isPublic
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/share/${data.share_token}`
        : null,
    });
  } catch (error) {
    console.error('Share update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}