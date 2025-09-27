"use client"

import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';

export interface Dataset {
  id: string;
  file_name: string;
  title?: string;
  description: string;
  field?: string;
  research_field?: string;
  tags: string[];
  row_count: number;
  column_count: number;
  file_size: number;
  quality_score: number;
  download_count: number;
  price_lamports: number;
  created_at: string;
  contributor_address?: string;
  topics?: string[];
  methodology?: string;
  geographic_scope?: string;
  timeframe?: string;
  sample_size?: number;
  word_count?: number;
  page_count?: number;
  language?: string;
  data_types?: string[];
}

export interface DatasetFilters {
  search?: string;
  field?: string;
  minQuality?: number;
  sortBy?: 'newest' | 'popular' | 'quality' | 'price';
}

// Mock data for development - expanded dataset
const mockDatasets: Dataset[] = [
  {
    id: '1',
    file_name: 'Climate Impact Survey - Uganda',
    description: 'Comprehensive climate change impact assessment data from rural Uganda communities',
    field: 'Environmental Science',
    tags: ['climate', 'uganda', 'agriculture', 'survey'],
    row_count: 2500,
    column_count: 15,
    file_size: 125000,
    quality_score: 92,
    download_count: 23,
    price_lamports: 1000000000, // 1 SOL
    created_at: '2024-01-15T10:00:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '2',
    file_name: 'Healthcare Access Data - Kenya',
    description: 'Rural healthcare accessibility and infrastructure data across 47 counties in Kenya',
    field: 'Public Health',
    tags: ['healthcare', 'kenya', 'rural', 'infrastructure'],
    row_count: 4700,
    column_count: 22,
    file_size: 280000,
    quality_score: 88,
    download_count: 45,
    price_lamports: 500000000, // 0.5 SOL
    created_at: '2024-01-10T14:30:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '3',
    file_name: 'Education Statistics - Nigeria',
    description: 'Primary and secondary education enrollment and completion rates across Nigerian states',
    field: 'Education',
    tags: ['education', 'nigeria', 'statistics', 'enrollment'],
    row_count: 1850,
    column_count: 18,
    file_size: 95000,
    quality_score: 95,
    download_count: 67,
    price_lamports: 0, // Free
    created_at: '2024-01-08T09:15:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '4',
    file_name: 'Agricultural Productivity Analysis - Ghana',
    description: 'Cocoa and cassava yield data with climate correlation analysis from Ashanti region',
    field: 'Agriculture',
    tags: ['agriculture', 'ghana', 'cocoa', 'cassava', 'yield'],
    row_count: 3200,
    column_count: 25,
    file_size: 180000,
    quality_score: 89,
    download_count: 34,
    price_lamports: 750000000, // 0.75 SOL
    created_at: '2024-01-12T16:45:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '5',
    file_name: 'Urban Migration Patterns - South Africa',
    description: 'Demographic analysis of rural-to-urban migration trends in major South African cities',
    field: 'Social Sciences',
    tags: ['migration', 'south africa', 'urban', 'demographics'],
    row_count: 5600,
    column_count: 30,
    file_size: 420000,
    quality_score: 91,
    download_count: 28,
    price_lamports: 1200000000, // 1.2 SOL
    created_at: '2024-01-14T11:20:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '6',
    file_name: 'Water Quality Assessment - Ethiopia',
    description: 'Comprehensive water quality testing results from rural and urban areas across Ethiopia',
    field: 'Environmental Science',
    tags: ['water', 'ethiopia', 'quality', 'environment'],
    row_count: 2800,
    column_count: 20,
    file_size: 165000,
    quality_score: 87,
    download_count: 19,
    price_lamports: 600000000, // 0.6 SOL
    created_at: '2024-01-11T13:30:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '7',
    file_name: 'Mobile Banking Adoption - Tanzania',
    description: 'Financial inclusion and mobile banking usage patterns across Tanzanian regions',
    field: 'Economics',
    tags: ['fintech', 'tanzania', 'banking', 'mobile', 'financial inclusion'],
    row_count: 4100,
    column_count: 28,
    file_size: 310000,
    quality_score: 93,
    download_count: 52,
    price_lamports: 900000000, // 0.9 SOL
    created_at: '2024-01-13T08:15:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '8',
    file_name: 'Renewable Energy Potential - Morocco',
    description: 'Solar and wind energy potential mapping with economic feasibility analysis',
    field: 'Technology',
    tags: ['renewable energy', 'morocco', 'solar', 'wind', 'sustainability'],
    row_count: 1900,
    column_count: 16,
    file_size: 140000,
    quality_score: 90,
    download_count: 31,
    price_lamports: 800000000, // 0.8 SOL
    created_at: '2024-01-09T15:45:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '9',
    file_name: 'Maternal Health Survey - Rwanda',
    description: 'Comprehensive maternal and child health outcomes data from rural health centers',
    field: 'Public Health',
    tags: ['maternal health', 'rwanda', 'healthcare', 'rural'],
    row_count: 3500,
    column_count: 24,
    file_size: 220000,
    quality_score: 94,
    download_count: 41,
    price_lamports: 700000000, // 0.7 SOL
    created_at: '2024-01-07T12:00:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  },
  {
    id: '10',
    file_name: 'Digital Literacy Assessment - Senegal',
    description: 'Technology adoption and digital skills assessment across urban and rural Senegal',
    field: 'Education',
    tags: ['digital literacy', 'senegal', 'technology', 'education'],
    row_count: 2600,
    column_count: 19,
    file_size: 155000,
    quality_score: 86,
    download_count: 25,
    price_lamports: 550000000, // 0.55 SOL
    created_at: '2024-01-06T10:30:00Z',
    contributor_address: '2QkJLTKTtYFHS6xir1TEXLSdajM7r1Djf96JogKnRGSR'
  }
];

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

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Combine mock data with user-uploaded data from localStorage
      const userDatasets = typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem('userDatasets') || '[]')
        : [];
      
      let filteredData = [...userDatasets, ...mockDatasets];

      // Apply filters
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(dataset => 
          dataset.file_name.toLowerCase().includes(searchLower) ||
          dataset.description.toLowerCase().includes(searchLower) ||
          dataset.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters.field) {
        filteredData = filteredData.filter(dataset => 
          dataset.field === filters.field || dataset.research_field === filters.field
        );
      }

      if (filters.minQuality !== undefined) {
        filteredData = filteredData.filter(dataset => dataset.quality_score >= filters.minQuality!);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'popular':
          filteredData.sort((a, b) => b.download_count - a.download_count);
          break;
        case 'quality':
          filteredData.sort((a, b) => b.quality_score - a.quality_score);
          break;
        case 'price':
          filteredData.sort((a, b) => a.price_lamports - b.price_lamports);
          break;
        case 'newest':
        default:
          filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }

      setDatasets(filteredData);

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

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const foundDataset = mockDatasets.find(dataset => dataset.id === id);
      
      if (!foundDataset) {
        throw new Error('Dataset not found');
      }

      setDataset(foundDataset);

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