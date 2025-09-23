"use client"

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Dataset {
  id: string;
  file_name: string;
  description: string;
  field: string;
  tags: string[];
  row_count: number;
  column_count: number;
  file_size: number;
  quality_score: number;
  download_count: number;
  price_lamports: number;
  created_at: string;
  contributor_address?: string;
}

export interface DatasetFilters {
  search?: string;
  field?: string;
  minQuality?: number;
  sortBy?: 'newest' | 'popular' | 'quality' | 'price';
}

export function useDatasets(filters: DatasetFilters = {}) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets();
  }, [filters.search, filters.field, filters.sortBy]);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`file_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.field) {
        query = query.eq('field', filters.field);
      }

      if (filters.minQuality) {
        query = query.gte('quality_score', filters.minQuality);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popular':
          query = query.order('download_count', { ascending: false });
          break;
        case 'quality':
          query = query.order('quality_score', { ascending: false });
          break;
        case 'price':
          query = query.order('price_lamports', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setDatasets(data || []);

    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch datasets');
    } finally {
      setLoading(false);
    }
  };

  const refreshDatasets = () => {
    fetchDatasets();
  };

  return {
    datasets,
    loading,
    error,
    refreshDatasets
  };
}

export function useDataset(id: string) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDataset();
    }
  }, [id]);

  const fetchDataset = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setDataset(data);

    } catch (err) {
      console.error('Error fetching dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dataset');
    } finally {
      setLoading(false);
    }
  };

  return {
    dataset,
    loading,
    error,
    refreshDataset: fetchDataset
  };
}