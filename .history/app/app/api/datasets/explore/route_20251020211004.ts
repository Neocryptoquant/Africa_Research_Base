import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role for public dataset access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Filters
    const search = searchParams.get('search');
    const field = searchParams.get('field');
    const minQuality = searchParams.get('minQuality');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';

    // Build query
    let query = supabase
      .from('datasets')
      .select(`
        *,
        uploader:users!datasets_user_id_fkey(
          id,
          full_name,
          email,
          affiliation,
          reputation_score
        )
      `)
      .eq('status', 'active');

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }

    if (field) {
      query = query.eq('research_field', field);
    }

    if (minQuality) {
      const minScore = parseInt(minQuality);
      query = query.or(`final_score.gte.${minScore},ai_quality_score.gte.${minScore}`);
    }

    if (verifiedOnly) {
      query = query.eq('verification_status', 'verified');
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'quality':
        query = query.order('final_score', { ascending: false, nullsFirst: false });
        break;
      case 'downloads':
        query = query.order('download_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: datasets, error, count } = await query;

    if (error) {
      console.error('Explore query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch datasets' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return NextResponse.json({
      datasets: datasets || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0),
      },
    });
  } catch (error) {
    console.error('Explore error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}