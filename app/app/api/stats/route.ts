// For statistics only | Valid Endpoint!!!

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Get total counts
    const { count: totalDatasets } = await supabase
      .from('datasets')
      .select('*', { count: 'exact', head: true });

    // Get field distribution
    const { data: fieldStats } = await supabase
      .from('datasets')
      .select('field')
      .order('field');

    const fieldCounts = fieldStats?.reduce((acc: any, item: any) => {
      acc[item.field] = (acc[item.field] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get recent datasets
    const { data: recentDatasets } = await supabase
      .from('datasets')
      .select('id, file_name, description, quality_score, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Get top contributors
    const { data: topContributors } = await supabase
      .from('datasets')
      .select('contributor_address')
      .order('quality_score', { ascending: false })
      .limit(5);

    const contributorCounts = topContributors?.reduce((acc: any, item: any) => {
      acc[item.contributor_address] = (acc[item.contributor_address] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      totalDatasets: totalDatasets || 0,
      totalDownloads: 0, // Calculate from sum if needed
      fieldDistribution: fieldCounts,
      recentDatasets: recentDatasets || [],
      topContributors: Object.entries(contributorCounts).map(([address, count]) => ({
        address,
        datasetCount: count
      }))
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch statistics' 
    }, { status: 500 });
  }
}