// Demo Data Seeder Script |

import 'dotenv/config';
import { supabase } from '../lib/supabase.js';
// import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Add this debugging
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');


const DEMO_DATASETS = [
  {
    file_name: 'uganda_climate_survey_2024.csv',
    description: 'Climate impact survey data from 500 households in Kampala region',
    field: 'environment',
    tags: ['climate', 'uganda', 'survey'],
    quality_score: 92,
    column_count: 45,
    row_count: 500,
    missing_percentage: 3.2,
    file_size: 245000,
    contributor_address: 'Demo1' + crypto.randomBytes(20).toString('hex'),
    price_lamports: 1000000000, // 1 SOL
  },
  {
    file_name: 'kenya_health_indicators_2024.xlsx',
    description: 'Public health metrics across 47 counties in Kenya',
    field: 'health',
    tags: ['health', 'kenya', 'public-health'],
    quality_score: 88,
    column_count: 67,
    row_count: 2340,
    missing_percentage: 5.8,
    file_size: 890000,
    contributor_address: 'Demo2' + crypto.randomBytes(20).toString('hex'),
    price_lamports: 2000000000, // 2 SOL
  },
  {
    file_name: 'nigeria_sme_economic_data.csv',
    description: 'Economic performance data from 1000 SMEs in Lagos State',
    field: 'economics',
    tags: ['economics', 'nigeria', 'sme', 'lagos'],
    quality_score: 95,
    column_count: 34,
    row_count: 1000,
    missing_percentage: 1.5,
    file_size: 567000,
    contributor_address: 'Demo3' + crypto.randomBytes(20).toString('hex'),
    price_lamports: 1500000000, // 1.5 SOL
  },
  {
    file_name: 'ghana_education_outcomes.csv',
    description: 'Educational achievement data from rural Ghana schools',
    field: 'social_sciences',
    tags: ['education', 'ghana', 'rural'],
    quality_score: 78,
    column_count: 23,
    row_count: 450,
    missing_percentage: 8.3,
    file_size: 123000,
    contributor_address: 'Demo4' + crypto.randomBytes(20).toString('hex'),
    price_lamports: 500000000, // 0.5 SOL
  },
  {
    file_name: 'tanzania_agriculture_yield.xlsx',
    description: 'Crop yield data from smallholder farmers in Tanzania',
    field: 'environment',
    tags: ['agriculture', 'tanzania', 'farming'],
    quality_score: 85,
    column_count: 56,
    row_count: 780,
    missing_percentage: 4.2,
    file_size: 445000,
    contributor_address: 'Demo5' + crypto.randomBytes(20).toString('hex'),
    price_lamports: 750000000, // 0.75 SOL
  }
];

async function seedDemoData() {
  console.log('Seeding demo data...');
  
  for (const dataset of DEMO_DATASETS) {
    const id = 'demo_' + crypto.randomBytes(16).toString('hex');
    const fileHash = crypto.randomBytes(32).toString('hex');
    
    // Create fake columns
    const columns = Array.from({ length: Math.min(10, dataset.column_count) }, (_, i) => ({
      name: `column_${i + 1}`,
      type: ['numeric', 'categorical', 'date', 'text'][Math.floor(Math.random() * 4)]
    }));
    
    // Create preview data
    const previewData = Array.from({ length: 5 }, (_, i) => {
      const row: any = {};
      columns.forEach(col => {
        row[col.name] = col.type === 'numeric' ? Math.random() * 100 : `sample_${i}`;
      });
      return row;
    });
    
    const { error } = await supabase
      .from('datasets')
      .insert({
        id,
        ...dataset,
        file_hash: fileHash,
        columns,
        preview_data: previewData,
        transaction_signature: 'demo_tx_' + Date.now(),
        download_count: Math.floor(Math.random() * 50),
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    
    if (error) {
      console.error('Error inserting dataset:', dataset.file_name, error);
    } else {
      console.log('Seeded:', dataset.file_name);
    }
    
    // Add fake file data
    await supabase
      .from('dataset_files')
      .insert({
        id: `${id}_file`,
        dataset_id: id,
        file_data: Buffer.from('Demo data content').toString('base64')
      });
  }
  
  console.log('Demo data seeding complete!');
}

// npx ts-node app/scripts/seed-demo-data.ts
seedDemoData();

