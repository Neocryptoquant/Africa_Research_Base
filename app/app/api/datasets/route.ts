// Search and Discovery of Datasets | Valid  Endpoint!!!
// export const runtime = "node.js";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const field = searchParams.get('field');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (field) {
      query = query.eq('field', field);
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (search) {
      query = query.or(`file_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      datasets: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'Search failed' 
    }, { status: 500 });
  }
}