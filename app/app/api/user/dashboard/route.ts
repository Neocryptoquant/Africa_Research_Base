// app/api/user/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get dataset stats
    const { data: datasets } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    const datasetsUploaded = datasets?.length || 0;
    const datasetsVerified = datasets?.filter(d => d.verification_status === 'verified').length || 0;
    const totalViews = datasets?.reduce((sum, d) => sum + (d.view_count || 0), 0) || 0;
    const totalDownloads = datasets?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0;

    // Get review stats
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewer_id', userId);

    const reviewsGiven = reviews?.length || 0;

    // Get recent activity (last 10 point transactions)
    const { data: recentActivity } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get top datasets (by score and engagement)
    const { data: topDatasets } = await supabase
      .from('datasets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(5);

    // Calculate reputation score
    const { data: reputationData } = await supabase
      .rpc('calculate_reputation_score', { p_user_id: userId });

    // Update reputation in profile
    if (reputationData) {
      await supabase
        .from('users')
        .update({ reputation_score: reputationData })
        .eq('id', userId);
    }

    return NextResponse.json({
      stats: {
        totalPoints: profile?.total_points || 0,
        reputationScore: reputationData || profile?.reputation_score || 0,
        datasetsUploaded,
        datasetsVerified,
        reviewsGiven,
        totalViews,
        totalDownloads,
      },
      recentActivity: recentActivity || [],
      topDatasets: topDatasets || [],
      profile,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}