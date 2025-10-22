// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabaseServer } from '@/lib/supabase';
import Papa from 'papaparse';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Points reward structure
const POINTS_REWARDS = {
  BASE_UPLOAD: 50,           // Base points for any upload
  QUALITY_90_PLUS: 100,      // Bonus for 90+ quality score
  QUALITY_80_89: 50,         // Bonus for 80-89 quality score
  QUALITY_70_79: 25,         // Bonus for 70-79 quality score
  LARGE_DATASET: 30,         // Bonus for datasets > 1000 rows
  FIRST_UPLOAD: 50,          // First upload bonus
};

interface AnalysisResult {
  qualityScore: number;
  description: string;
  tags: string[];
  dataTypes: string[];
  rowCount: number;
  columnCount: number;
  completeness: number;
  consistency: number;
}

async function analyzeDatasetWithGemini(
  fileContent: string,
  fileName: string,
  fileType: string
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Parse CSV to get actual data
    let parsedData: an[] = [];
    let headers: string[] = [];
    
    if (fileType === 'csv') {
      const result = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      parsedData = result.data.slice(0, 100); // First 100 rows
      headers = result.meta.fields || [];
    }

    const rowCount = parsedData.length;
    const columnCount = headers.length;

    // Calculate completeness
    let totalCells = 0;
    let filledCells = 0;
    parsedData.forEach(row => {
      headers.forEach(header => {
        totalCells++;
        if (row[header] !== null && row[header] !== undefined && row[header] !== '') {
          filledCells++;
        }
      });
    });
    const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

    // Create analysis prompt
    const prompt = `Analyze this research dataset and provide a structured assessment.

Dataset: ${fileName}
Columns: ${headers.join(', ')}
Row Count: ${rowCount}
Column Count: ${columnCount}
Completeness: ${completeness.toFixed(2)}%

Sample Data (first 3 rows):
${JSON.stringify(parsedData.slice(0, 3), null, 2)}

Please analyze and respond in this EXACT JSON format (no markdown, just JSON):
{
  "qualityScore": <number 0-100>,
  "description": "<brief 2-3 sentence description of the dataset>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"],
  "dataTypes": ["<type1>", "<type2>"],
  "consistency": <number 0-100>
}

Quality score should consider:
- Data completeness (${completeness.toFixed(2)}%)
- Column relevance and naming
- Data consistency
- Research value for African studies
- Potential use cases

Tags should be specific, relevant terms for African research (e.g., "agriculture", "health", "climate").
Data types should describe the nature of data (e.g., "survey", "experimental", "observational").
Consistency score should assess data quality and uniformity.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean the response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    const analysis = JSON.parse(cleanedResponse);

    return {
      qualityScore: Math.min(100, Math.max(0, analysis.qualityScore || 0)),
      description: analysis.description || 'Research dataset for African studies',
      tags: analysis.tags || ['research', 'data', 'africa'],
      dataTypes: analysis.dataTypes || ['research'],
      rowCount,
      columnCount,
      completeness: Math.round(completeness),
      consistency: Math.min(100, Math.max(0, analysis.consistency || 0))
    };

  } catch (error) {
    console.error('Gemini AI analysis error:', error);
    
    // Fallback analysis
    return {
      qualityScore: 70,
      description: 'Research dataset uploaded to Africa Research Base',
      tags: ['research', 'data', 'africa'],
      dataTypes: ['research'],
      rowCount: 0,
      columnCount: 0,
      completeness: 75,
      consistency: 75
    };
  }
}

function calculatePoints(
  qualityScore: number,
  rowCount: number,
  isFirstUpload: boolean
): { totalPoints: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    base: POINTS_REWARDS.BASE_UPLOAD
  };

  // Quality bonuses
  if (qualityScore >= 90) {
    breakdown.quality = POINTS_REWARDS.QUALITY_90_PLUS;
  } else if (qualityScore >= 80) {
    breakdown.quality = POINTS_REWARDS.QUALITY_80_89;
  } else if (qualityScore >= 70) {
    breakdown.quality = POINTS_REWARDS.QUALITY_70_79;
  }

  // Large dataset bonus
  if (rowCount >= 1000) {
    breakdown.largeDataset = POINTS_REWARDS.LARGE_DATASET;
  }

  // First upload bonus
  if (isFirstUpload) {
    breakdown.firstUpload = POINTS_REWARDS.FIRST_UPLOAD;
  }

  const totalPoints = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return { totalPoints, breakdown };
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseServer!.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Upload request from user:', user.id);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const researchField = formData.get('researchField') as string;

    if (!file || !title || !researchField) {
      return NextResponse.json(
        { error: 'File, title, and research field are required' },
        { status: 400 }
      );
    }

    console.log('Processing file:', file.name);

    // Validate file
    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.pdf', '.txt'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: CSV, Excel, PDF, TXT' },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const uniqueFilename = `${timestamp}-${randomId}${fileExtension}`;

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadsDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    console.log('File saved:', uniqueFilename);

    // Generate file URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fullUrl = `${baseUrl}${fileUrl}`;

    // Analyze with AI (only for CSV files, fallback for others)
    let analysis: AnalysisResult;
    
    if (fileExtension === '.csv') {
      const fileContent = buffer.toString('utf-8');
      analysis = await analyzeDatasetWithGemini(fileContent, file.name, 'csv');
    } else {
      // Fallback for non-CSV files
      analysis = {
        qualityScore: 75,
        description: description || `${researchField} research dataset`,
        tags: [researchField.toLowerCase(), 'research', 'africa'],
        dataTypes: ['research', 'document'],
        rowCount: 0,
        columnCount: 0,
        completeness: 80,
        consistency: 80
      };
    }

    console.log('AI Analysis completed:', analysis);

    // Check if this is user's first upload
    const { count: uploadCount } = await supabaseServer!
      .from('datasets')
      .select('id', { count: 'exact', head: true })
      .eq('uploader_id', user.id);

    const isFirstUpload = (uploadCount || 0) === 0;

    // Calculate points reward
    const pointsData = calculatePoints(
      analysis.qualityScore,
      analysis.rowCount,
      isFirstUpload
    );

    console.log('Points calculation:', pointsData);

    // Create dataset in database
    const datasetId = `ds_${timestamp}_${randomId}`;
    
    const { data: dataset, error: datasetError } = await supabaseServer!
      .from('datasets')
      .insert({
        id: datasetId,
        uploader_id: user.id,
        title,
        description: description || analysis.description,
        file_name: file.name,
        file_path: fileUrl,
        file_size: file.size,
        file_type: fileExtension.substring(1),
        research_field: researchField,
        tags: analysis.tags,
        data_types: analysis.dataTypes,
        row_count: analysis.rowCount,
        column_count: analysis.columnCount,
        quality_score: analysis.qualityScore,
        completeness_score: analysis.completeness,
        consistency_score: analysis.consistency,
        ai_confidence_score: analysis.qualityScore,
        status: 'ai_verified',
        is_verified: false,
        total_reviews: 0,
        download_count: 0,
        view_count: 0
      })
      .select()
      .single();

    if (datasetError) {
      console.error('Dataset creation error:', datasetError);
      return NextResponse.json(
        { error: 'Failed to create dataset record' },
        { status: 500 }
      );
    }

    console.log('Dataset created:', dataset.id);

    // Award points to user
    const { error: pointsError } = await supabaseServer!
      .from('points_transactions')
      .insert({
        user_id: user.id,
        points: pointsData.totalPoints,
        transaction_type: 'dataset_upload',
        dataset_id: dataset.id,
        description: `Uploaded dataset: ${title}`,
        metadata: {
          quality_score: analysis.qualityScore,
          row_count: analysis.rowCount,
          breakdown: pointsData.breakdown,
          is_first_upload: isFirstUpload
        }
      });

    if (pointsError) {
      console.error('Points transaction error:', pointsError);
      // Don't fail the upload if points fail
    } else {
      console.log('Points awarded:', pointsData.totalPoints);
    }

    // Get updated user points
    const { data: userProfile } = await supabaseServer!
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single();

    // Return success response
    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        title: dataset.title,
        description: dataset.description,
        fileName: dataset.file_name,
        fileSize: dataset.file_size,
        fileUrl: fullUrl,
        downloadUrl: fullUrl,
        researchField: dataset.research_field,
        tags: dataset.tags,
        qualityScore: dataset.quality_score,
        rowCount: dataset.row_count,
        columnCount: dataset.column_count,
        createdAt: dataset.created_at
      },
      rewards: {
        pointsEarned: pointsData.totalPoints,
        breakdown: pointsData.breakdown,
        newTotalPoints: userProfile?.total_points || 0,
        badges: {
          firstUpload: isFirstUpload,
          highQuality: analysis.qualityScore >= 90,
          largeDataset: analysis.rowCount >= 1000
        }
      },
      analysis: {
        qualityScore: analysis.qualityScore,
        completeness: analysis.completeness,
        consistency: analysis.consistency,
        description: analysis.description
      },
      message: `Upload successful! You earned ${pointsData.totalPoints} points!`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint - use POST to upload files',
    pointsStructure: POINTS_REWARDS
  });
}