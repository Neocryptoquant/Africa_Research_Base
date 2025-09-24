// Dataset Details | Valid Endpoint!!!
// export const runtime = "edge";
// export const runtime = "node.js";



import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
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
      .eq('id', id);

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching dataset:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dataset' 
    }, { status: 500 });
  }
}
