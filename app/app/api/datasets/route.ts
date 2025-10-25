// 0xAbim: Search and Discovery of Datasets API endpoint
// Supports filtering by research field, tags, and full-text search
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// 0xAbim: Maximum limit to prevent abuse
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
  try {
    // 0xAbim: Parse and validate query parameters
    const searchParams = req.nextUrl.searchParams;
    const researchField = searchParams.get('field') || searchParams.get('research_field');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    // 0xAbim: Validate and sanitize pagination parameters
    let limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    let offset = parseInt(searchParams.get('offset') || '0');

    // Prevent invalid values
    if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    if (isNaN(offset) || offset < 0) offset = 0;

    // 0xAbim: Build query with proper filters
    let query = supabase
      .from('datasets')
      .select('*', { count: 'exact' })
      .eq('is_public', true) // Only return public datasets
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 0xAbim: Apply research field filter (updated from 'field' to 'research_field')
    if (researchField) {
      query = query.eq('research_field', researchField);
    }

    // 0xAbim: Apply tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // 0xAbim: Apply full-text search with proper sanitization
    if (search) {
      // Sanitize search input to prevent injection
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(
        `file_name.ilike.%${sanitizedSearch}%,` +
        `title.ilike.%${sanitizedSearch}%,` +
        `description.ilike.%${sanitizedSearch}%`
      );
    }

    const { data, error, count } = await query;

    // 0xAbim: Handle query errors
    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Datasets] Query error:', error);
      }
      return NextResponse.json({
        error: 'Failed to fetch datasets'
      }, { status: 500 });
    }

    // 0xAbim: Return paginated results with metadata
    return NextResponse.json({
      datasets: data || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });

  } catch (error) {
    // 0xAbim: Log errors securely
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Datasets] Search error:', error);
    }
    return NextResponse.json({
      error: 'Search failed'
    }, { status: 500 });
  }
}