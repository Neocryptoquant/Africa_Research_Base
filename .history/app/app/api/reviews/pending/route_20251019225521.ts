export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer!.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get datasets that need review (not uploaded by current user, not already reviewed by them)
    const { data: datasets, error } = await supabaseServer!
      .from('datasets')
      .select(`
        *,
        uploader:users!uploader_id(
          full_name,
          institution,
          avatar_url
        ),
        reviews!reviews_dataset_id_fkey(
          id,
          reviewer_id
        )
      `)
      .in('status', ['ai_verified', 'under_review'])
      .neq('uploader_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
    }

    // Filter out datasets already reviewed by current user
    const pendingDatasets = datasets?.filter(dataset => 
      !dataset.reviews?.some((r: any) => r.reviewer_id === user.id)
    ) || [];

    return NextResponse.json({
      success: true,
      datasets: pendingDatasets
    });

  } catch (error) {
    console.error('Pending reviews error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}