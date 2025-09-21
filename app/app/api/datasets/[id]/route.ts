// Dataset Details | Valid Endpoint!!!

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        error: 'Dataset not found' 
      }, { status: 404 });
    }

    // Increment view count (not download count)
    await supabase
      .from('datasets')
      .update({ download_count: (data.download_count || 0) + 1 })
      .eq('id', params.id);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dataset' 
    }, { status: 500 });
  }
}
