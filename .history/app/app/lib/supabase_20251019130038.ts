import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For Turbopack compatibility, we'll access environment variables directly
// instead of using dotenv config which can cause issues with the new bundler

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Client-side Supabase client (for use in components)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Client component helper (for App Router with auth)
export const createClient = () => createClientComponentClient();

// Server-side Supabase client (for API routes - requires service role key)
export const supabaseServer = supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Warn if service role key is missing (needed for API routes)
if (!supabaseServiceKey && typeof window === 'undefined') {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. API routes may not work properly.');
}

// ==============================================
// Database Types
// ==============================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          institution: string | null;
          research_field: string | null;
          country: string | null;
          bio: string | null;
          avatar_url: string | null;
          wallet_address: string | null;
          total_points: number;
          role: 'researcher' | 'reviewer' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at' | 'total_points'> & {
          id: string;
          total_points?: number;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      datasets: {
        Row: {
          id: string;
          uploader_id: string;
          title: string;
          description: string;
          research_field: string;
          tags: string[];
          file_name: string;
          file_size: number;
          file_type: string;
          file_url: string;
          ipfs_hash: string | null;
          column_count: number | null;
          row_count: number | null;
          data_preview: any;
          ai_confidence_score: number | null;
          ai_analysis: any;
          ai_verified_at: string | null;
          human_verification_score: number | null;
          total_reviews: number;
          is_verified: boolean;
          verified_at: string | null;
          final_verification_score: number | null;
          status: 'pending' | 'ai_verified' | 'under_review' | 'verified' | 'rejected';
          is_public: boolean;
          share_link: string;
          view_count: number;
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['datasets']['Row'], 'id' | 'created_at' | 'updated_at' | 'share_link' | 'total_reviews' | 'is_verified' | 'view_count' | 'download_count'> & {
          total_reviews?: number;
          is_verified?: boolean;
          view_count?: number;
          download_count?: number;
        };
        Update: Partial<Database['public']['Tables']['datasets']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          dataset_id: string;
          reviewer_id: string;
          rating: number;
          feedback: string | null;
          quality_metrics: any;
          is_approved: boolean | null;
          verification_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      points_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          transaction_type: 'dataset_upload' | 'dataset_verification' | 'review_submitted' | 'social_share' | 'yapping' | 'withdrawal' | 'bonus';
          dataset_id: string | null;
          review_id: string | null;
          description: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['points_transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['points_transactions']['Insert']>;
      };
      social_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
          platform_username: string;
          platform_user_id: string | null;
          is_verified: boolean;
          connected_at: string;
        };
        Insert: Omit<Database['public']['Tables']['social_connections']['Row'], 'id' | 'connected_at' | 'is_verified'> & {
          is_verified?: boolean;
        };
        Update: Partial<Database['public']['Tables']['social_connections']['Insert']>;
      };
    };
  };
}

// ==============================================
// Helper Functions
// ==============================================

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's total points
 */
export async function getUserPoints(userId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('users')
    .select('total_points')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data.total_points;
}

/**
 * Get dataset by share link (with uploader and reviews)
 */
export async function getDatasetByShareLink(shareLink: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('datasets')
    .select(`
      *,
      uploader:users!uploader_id(
        full_name,
        institution,
        avatar_url,
        research_field
      ),
      reviews(
        id,
        rating,
        feedback,
        quality_metrics,
        created_at,
        reviewer:users!reviewer_id(
          full_name,
          avatar_url,
          institution
        )
      )
    `)
    .eq('share_link', shareLink)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all datasets uploaded by a user
 */
export async function getUserDatasets(userId: string, limit?: number) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  let query = supabaseServer
    .from('datasets')
    .select('*')
    .eq('uploader_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get recent points transactions for a user
 */
export async function getRecentPointsTransactions(userId: string, limit = 10) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('points_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get datasets pending review
 */
export async function getDatasetsPendingReview(limit = 20) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('datasets')
    .select(`
      *,
      uploader:users!uploader_id(
        full_name,
        institution
      )
    `)
    .in('status', ['ai_verified', 'under_review'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

/**
 * Get all reviews for a dataset
 */
export async function getDatasetReviews(datasetId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviewer_id(
        full_name,
        avatar_url,
        institution,
        research_field
      )
    `)
    .eq('dataset_id', datasetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Increment dataset view count
 */
export async function incrementViewCount(datasetId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { error } = await supabaseServer.rpc('increment_view_count', {
    dataset_id: datasetId
  });

  if (error) {
    // Fallback to manual increment if RPC doesn't exist
    const { data: dataset } = await supabaseServer
      .from('datasets')
      .select('view_count')
      .eq('id', datasetId)
      .single();

    if (dataset) {
      await supabaseServer
        .from('datasets')
        .update({ view_count: (dataset.view_count || 0) + 1 })
        .eq('id', datasetId);
    }
  }
}

/**
 * Increment dataset download count
 */
export async function incrementDownloadCount(datasetId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { error } = await supabaseServer.rpc('increment_download_count', {
    dataset_id: datasetId
  });

  if (error) {
    // Fallback to manual increment if RPC doesn't exist
    const { data: dataset } = await supabaseServer
      .from('datasets')
      .select('download_count')
      .eq('id', datasetId)
      .single();

    if (dataset) {
      await supabaseServer
        .from('datasets')
        .update({ download_count: (dataset.download_count || 0) + 1 })
        .eq('id', datasetId);
    }
  }
}

/**
 * Check if user has already reviewed a dataset
 */
export async function hasUserReviewedDataset(userId: string, datasetId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { data, error } = await supabaseServer
    .from('reviews')
    .select('id')
    .eq('reviewer_id', userId)
    .eq('dataset_id', datasetId)
    .single();

  return data !== null && !error;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  if (!supabaseServer) {
    throw new Error('Server client not available. Set SUPABASE_SERVICE_ROLE_KEY.');
  }

  // Get datasets count
  const { count: datasetsCount } = await supabaseServer
    .from('datasets')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', userId);

  // Get verified datasets count
  const { count: verifiedCount } = await supabaseServer
    .from('datasets')
    .select('*', { count: 'exact', head: true })
    .eq('uploader_id', userId)
    .eq('is_verified', true);

  // Get reviews count
  const { count: reviewsCount } = await supabaseServer
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('reviewer_id', userId);

  // Get total points
  const { data: userData } = await supabaseServer
    .from('users')
    .select('total_points')
    .eq('id', userId)
    .single();

  return {
    totalDatasets: datasetsCount || 0,
    verifiedDatasets: verifiedCount || 0,
    totalReviews: reviewsCount || 0,
    totalPoints: userData?.total_points || 0
  };
}