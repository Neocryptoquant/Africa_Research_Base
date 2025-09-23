// For statistics only | Valid Endpoint!!!
// export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(_request: NextRequest) {
  try {
    // Get dataset statistics
    const { data: datasets, error } = await supabase
      .from('datasets')
      .select('*');

    if (error) {
      throw error;
    }

    // Calculate statistics
    const stats = {
      totalDatasets: datasets?.length || 0,
      avgQualityScore: datasets?.length
        ? Math.round(datasets.reduce((sum: number, d: { quality_score: number }) => sum + d.quality_score, 0) / datasets.length)
        : 0,
      totalDownloads: datasets?.reduce((sum: number, d: { download_count: number }) => sum + d.download_count, 0) || 0,
      fieldDistribution: datasets?.reduce((acc: Record<string, number>, d: { field: string }) => {
        acc[d.field] = (acc[d.field] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      qualityDistribution: {
        excellent: datasets?.filter((d: { quality_score: number }) => d.quality_score >= 80).length || 0,
        good: datasets?.filter((d: { quality_score: number }) => d.quality_score >= 60 && d.quality_score < 80).length || 0,
        fair: datasets?.filter((d: { quality_score: number }) => d.quality_score >= 40 && d.quality_score < 60).length || 0,
        poor: datasets?.filter((d: { quality_score: number }) => d.quality_score < 40).length || 0
      }
    };

    return NextResponse.json(stats, { status: 200 });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      error: 'Failed to fetch statistics'
    }, { status: 500 });
  }
}