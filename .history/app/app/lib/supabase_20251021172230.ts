/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * ============================================================
 * SUPABASE CONFIGURATION
 * ============================================================
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKey) throw new Error("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * ============================================================
 * CLIENTS
 * ============================================================
 */

// ✅ Public Supabase client for browser-side use
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ✅ App Router Client (for use inside Next.js components)
export const createClient = () => createClientComponentClient();

// ✅ Server-side Supabase client using Service Role Key (secure admin access)
export const supabaseServer = (() => {
  if (typeof window !== "undefined") return null; // Prevent server key on client

  if (!supabaseServiceKey) {
    console.warn("⚠️ Missing SUPABASE_SERVICE_ROLE_KEY — server operations may fail.");
    return null;
  }

  console.log("🔐 Supabase service key prefix:", supabaseServiceKey.slice(0, 6));

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "X-Client-Info": "supabase-server-client" } },
  });
})();

/**
 * ============================================================
 * DATABASE TYPES
 * ============================================================
 */
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
          role: "researcher" | "reviewer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          institution?: string | null;
          research_field?: string | null;
          country?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          wallet_address?: string | null;
          total_points?: number;
          role?: "researcher" | "reviewer" | "admin";
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
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
          status: "pending" | "ai_verified" | "under_review" | "verified" | "rejected";
          is_public: boolean;
          share_link: string;
          view_count: number;
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["datasets"]["Row"],
          "id" | "created_at" | "updated_at" | "share_link"
        > & { share_link?: string };
        Update: Partial<Database["public"]["Tables"]["datasets"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };

      points_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          transaction_type:
            | "dataset_upload"
            | "dataset_verification"
            | "review_submitted"
            | "social_share"
            | "yapping"
            | "withdrawal"
            | "bonus";
          dataset_id: string | null;
          review_id: string | null;
          description: string | null;
          metadata: any;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["points_transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["points_transactions"]["Insert"]>;
      };

      social_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: "twitter" | "linkedin" | "facebook" | "instagram";
          platform_username: string;
          platform_user_id: string | null;
          is_verified: boolean;
          connected_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["social_connections"]["Row"],
          "id" | "connected_at"
        > & { is_verified?: boolean };
        Update: Partial<Database["public"]["Tables"]["social_connections"]["Insert"]>;
      };
    };
  };
}

/**
 * ============================================================
 * SERVER-SAFE HELPERS
 * ============================================================
 */

const assertServer = () => {
  if (!supabaseServer) throw new Error("❌ Server Supabase client not available.");
  return supabaseServer;
};

// -- USERS --
export async function getUserProfile(userId: string) {
  const { data, error } = await assertServer()
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserPoints(userId: string) {
  const { data, error } = await assertServer()
    .from("users")
    .select("total_points")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.total_points;
}

// -- DATASETS --
export async function getDatasetByShareLink(shareLink: string) {
  const { data, error } = await assertServer()
    .from("datasets")
    .select(
      `
      *,
      uploader:users!uploader_id(full_name,institution,avatar_url,research_field),
      reviews(
        id,rating,feedback,quality_metrics,created_at,
        reviewer:users!reviewer_id(full_name,avatar_url,institution)
      )
    `
    )
    .eq("share_link", shareLink)
    .single();
  if (error) throw error;
  return data;
}

export async function getUserDatasets(userId: string, limit?: number) {
  let query = assertServer()
    .from("datasets")
    .select("*")
    .eq("uploader_id", userId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// -- POINTS --
export async function getRecentPointsTransactions(userId: string, limit = 10) {
  const { data, error } = await assertServer()
    .from("points_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// -- REVIEWS --
export async function getDatasetReviews(datasetId: string) {
  const { data, error } = await assertServer()
    .from("reviews")
    .select(
      `
      *,
      reviewer:users!reviewer_id(full_name,avatar_url,institution,research_field)
    `
    )
    .eq("dataset_id", datasetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// -- METRICS --
export async function getUserStats(userId: string) {
  const server = assertServer();

  const [
    { count: datasetsCount },
    { count: verifiedCount },
    { count: reviewsCount },
    { data: userData },
  ] = await Promise.all([
    server.from("datasets").select("*", { count: "exact", head: true }).eq("uploader_id", userId),
    server
      .from("datasets")
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", userId)
      .eq("is_verified", true),
    server.from("reviews").select("*", { count: "exact", head: true }).eq("reviewer_id", userId),
    server.from("users").select("total_points").eq("id", userId).single(),
  ]);

  return {
    totalDatasets: datasetsCount || 0,
    verifiedDatasets: verifiedCount || 0,
    totalReviews: reviewsCount || 0,
    totalPoints: userData?.total_points || 0,
  };
}
