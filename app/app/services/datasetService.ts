"use client"

import { supabase } from '../lib/supabase';

export interface DatasetRecord {
  id?: string;
  title: string;
  description: string;
  research_field: string;
  contributor_address: string;
  price_sol: number;
  is_free: boolean;
  quality_score: number;
  file_name: string;
  file_size: number;
  file_url?: string;
  topics: string[];
  methodology: string;
  geographic_scope: string;
  timeframe: string;
  word_count: number;
  page_count: number;
  language: string;
  data_types: string[];
  sample_size?: number;
  downloads: number;
  upload_date: string;
  blockchain_tx?: string;
  blockchain_pda?: string;
}

export class DatasetService {
  
  // Create a new dataset in the database
  static async createDataset(dataset: Omit<DatasetRecord, 'id' | 'downloads'>): Promise<DatasetRecord> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .insert([{
          ...dataset,
          downloads: 0
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create dataset: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Dataset creation error:', error);
      throw error;
    }
  }

  // Get all datasets with optional filtering
  static async getDatasets(filters?: {
    research_field?: string;
    is_free?: boolean;
    min_quality?: number;
    search?: string;
  }): Promise<DatasetRecord[]> {
    try {
      let query = supabase
        .from('datasets')
        .select('*')
        .order('upload_date', { ascending: false });

      if (filters?.research_field) {
        query = query.eq('research_field', filters.research_field);
      }

      if (filters?.is_free !== undefined) {
        query = query.eq('is_free', filters.is_free);
      }

      if (filters?.min_quality) {
        query = query.gte('quality_score', filters.min_quality);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch datasets: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Dataset fetch error:', error);
      return []; // Return empty array on error to prevent app crash
    }
  }

  // Get dataset by ID
  static async getDatasetById(id: string): Promise<DatasetRecord | null> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Dataset fetch error:', error);
      return null;
    }
  }

  // Increment download count
  static async incrementDownloads(id: string): Promise<void> {
    try {
      // First, get the current dataset to read the current downloads count
      const { data: currentDataset, error: fetchError } = await supabase
        .from('datasets')
        .select('downloads')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current downloads:', fetchError);
        return;
      }

      // Increment the downloads count
      const newDownloads = (currentDataset?.downloads || 0) + 1;

      // Update with the new count
      const { error: updateError } = await supabase
        .from('datasets')
        .update({ downloads: newDownloads })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to increment downloads:', updateError);
      }
    } catch (error) {
      console.error('Download increment error:', error);
    }
  }

  // Update blockchain information
  static async updateBlockchainInfo(id: string, txHash: string, pda: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ 
          blockchain_tx: txHash,
          blockchain_pda: pda 
        })
        .eq('id', id);

      if (error) {
        console.error('Failed to update blockchain info:', error);
      }
    } catch (error) {
      console.error('Blockchain update error:', error);
    }
  }

  // Get datasets by contributor
  static async getDatasetsByContributor(contributorAddress: string): Promise<DatasetRecord[]> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('contributor_address', contributorAddress)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Contributor datasets fetch error:', error);
      return [];
    }
  }

  // Search datasets
  static async searchDatasets(searchTerm: string): Promise<DatasetRecord[]> {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,topics.cs.{${searchTerm}}`)
        .order('quality_score', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // Get statistics
  static async getStatistics(): Promise<{
    totalDatasets: number;
    totalDownloads: number;
    avgQualityScore: number;
    topResearchFields: Array<{ field: string; count: number }>;
  }> {
    try {
      // Get total datasets and downloads
      const { data: datasets, error: datasetsError } = await supabase
        .from('datasets')
        .select('quality_score, downloads, research_field');

      if (datasetsError) {
        console.error('Statistics error:', datasetsError);
        return {
          totalDatasets: 0,
          totalDownloads: 0,
          avgQualityScore: 0,
          topResearchFields: []
        };
      }

      const totalDatasets = datasets?.length || 0;
      const totalDownloads = datasets?.reduce((sum, d) => sum + (d.downloads || 0), 0) || 0;
      const avgQualityScore = datasets?.length 
        ? datasets.reduce((sum, d) => sum + (d.quality_score || 0), 0) / datasets.length 
        : 0;

      // Count research fields
      const fieldCounts: Record<string, number> = {};
      datasets?.forEach(d => {
        if (d.research_field) {
          fieldCounts[d.research_field] = (fieldCounts[d.research_field] || 0) + 1;
        }
      });

      const topResearchFields = Object.entries(fieldCounts)
        .map(([field, count]) => ({ field, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalDatasets,
        totalDownloads,
        avgQualityScore: Math.round(avgQualityScore),
        topResearchFields
      };
    } catch (error) {
      console.error('Statistics error:', error);
      return {
        totalDatasets: 0,
        totalDownloads: 0,
        avgQualityScore: 0,
        topResearchFields: []
      };
    }
  }
}
