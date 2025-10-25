// api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

interface DatasetMetadata {
  title: string;
  description: string;
  researchField: string;
  tags: string[];
  fileName: string;
  fileSize: number;
  fileType: string;
  columnCount: number;
  rowCount: number;
  dataPreview: any[];
  fields: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { 
      file, 
      metadata 
    }: { 
      file: { data: string; name: string; type: string; size: number }; 
      metadata: DatasetMetadata 
    } = body;

    console.log('Upload started for user:', user.id);

    // Step 1: Upload file to Supabase Storage
    const fileExt = metadata.fileName.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.data.split(',')[1], 'base64');
    
    const { data: storageData, error: storageError } = await supabase.storage
      .from('datasets')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      console.error('Storage error:', storageError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('datasets')
      .getPublicUrl(fileName);

    console.log('File uploaded to storage:', publicUrl);

    // Step 2: Perform AI Analysis and Verification
    console.log('Starting AI verification...');
    const aiAnalysis = await performAIVerification(metadata);
    console.log('AI verification complete. Score:', aiAnalysis.confidenceScore);

    // Step 3: Insert dataset record into database
    const { data: dataset, error: dbError } = await supabase
      .from('datasets')
      .insert({
        uploader_id: user.id,
        title: metadata.title,
        description: metadata.description,
        research_field: metadata.researchField,
        tags: metadata.tags,
        file_name: metadata.fileName,
        file_size: metadata.fileSize,
        file_type: metadata.fileType,
        file_url: publicUrl,
        column_count: metadata.columnCount,
        row_count: metadata.rowCount,
        data_preview: metadata.dataPreview,
        ai_confidence_score: aiAnalysis.confidenceScore,
        ai_analysis: aiAnalysis.analysis,
        ai_verified_at: new Date().toISOString(),
        status: aiAnalysis.confidenceScore >= 50 ? 'ai_verified' : 'pending',
        is_public: false // Will be made public after human verification
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save dataset', details: dbError }, { status: 500 });
    }

    console.log('Dataset saved to database:', dataset.id);

    // Step 4: Award points to uploader
    const pointsAwarded = calculateUploadPoints(aiAnalysis.confidenceScore);
    
    const { error: pointsError } = await supabase
      .from('points_transactions')
      .insert({
        user_id: user.id,
        points: pointsAwarded,
        transaction_type: 'dataset_upload',
        dataset_id: dataset.id,
        description: `Dataset upload: ${metadata.title}`,
        metadata: {
          ai_score: aiAnalysis.confidenceScore,
          dataset_size: metadata.rowCount
        }
      });

    if (pointsError) {
      console.error('Points error:', pointsError);
      // Don't fail the request, just log the error
    }

    console.log('Points awarded:', pointsAwarded);

    // Step 5: Return success response
    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        title: dataset.title,
        shareLink: dataset.share_link,
        aiScore: aiAnalysis.confidenceScore,
        status: dataset.status,
        pointsAwarded
      },
      aiAnalysis: {
        score: aiAnalysis.confidenceScore,
        summary: aiAnalysis.analysis.summary,
        strengths: aiAnalysis.analysis.strengths,
        improvements: aiAnalysis.analysis.improvements
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload dataset', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Performs AI-based verification and scoring of the dataset
 */
async function performAIVerification(metadata: DatasetMetadata) {
  try {
    // Prepare data summary for AI analysis
    const dataSummary = {
      title: metadata.title,
      description: metadata.description,
      researchField: metadata.researchField,
      rowCount: metadata.rowCount,
      columnCount: metadata.columnCount,
      fields: metadata.fields,
      sampleData: metadata.dataPreview
    };

    // Call OpenAI API for analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert data scientist and research data validator for Africa Research Base. 
Your job is to analyze research datasets and provide a confidence score (0-100) along with detailed analysis.

Evaluate based on:
1. Data Quality (30%): Completeness, consistency, proper formatting
2. Research Relevance (25%): Alignment with stated research field and African context
3. Metadata Quality (20%): Clear title, comprehensive description, appropriate tags
4. Data Structure (15%): Logical column names, appropriate data types, sufficient sample size
5. Usability (10%): Likelihood of being useful for other researchers

Return a JSON object with:
{
  "confidenceScore": number (0-100),
  "analysis": {
    "summary": "Brief overall assessment",
    "strengths": ["strength1", "strength2", ...],
    "improvements": ["improvement1", "improvement2", ...],
    "qualityMetrics": {
      "dataQuality": number (0-100),
      "researchRelevance": number (0-100),
      "metadataQuality": number (0-100),
      "dataStructure": number (0-100),
      "usability": number (0-100)
    },
    "recommendations": ["rec1", "rec2", ...]
  }
}`
        },
        {
          role: 'user',
          content: `Please analyze this research dataset:\n\n${JSON.stringify(dataSummary, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      confidenceScore: result.confidenceScore || 0,
      analysis: result.analysis || {
        summary: 'Unable to analyze dataset',
        strengths: [],
        improvements: [],
        qualityMetrics: {},
        recommendations: []
      }
    };

  } catch (error) {
    console.error('AI verification error:', error);
    
    // Fallback to basic heuristic scoring if AI fails
    return {
      confidenceScore: calculateBasicScore(metadata),
      analysis: {
        summary: 'Basic automated analysis (AI service unavailable)',
        strengths: ['Dataset uploaded successfully'],
        improvements: ['Pending detailed AI analysis'],
        qualityMetrics: {
          dataQuality: calculateBasicScore(metadata),
          researchRelevance: 70,
          metadataQuality: metadata.description.length > 100 ? 80 : 50,
          dataStructure: 70,
          usability: 60
        },
        recommendations: ['Add more detailed description', 'Ensure proper data formatting']
      }
    };
  }
}

/**
 * Fallback scoring based on basic heuristics
 */
function calculateBasicScore(metadata: DatasetMetadata): number {
  let score = 50; // Base score

  // Title quality (max +10)
  if (metadata.title.length > 10) score += 5;
  if (metadata.title.length > 30) score += 5;

  // Description quality (max +15)
  if (metadata.description.length > 50) score += 5;
  if (metadata.description.length > 150) score += 5;
  if (metadata.description.length > 300) score += 5;

  // Dataset size (max +15)
  if (metadata.rowCount > 10) score += 5;
  if (metadata.rowCount > 100) score += 5;
  if (metadata.rowCount > 1000) score += 5;

  // Column quality (max +10)
  if (metadata.columnCount >= 3) score += 5;
  if (metadata.columnCount >= 5) score += 5;

  return Math.min(score, 100);
}

/**
 * Calculate points awarded based on AI score
 */
function calculateUploadPoints(aiScore: number): number {
  // Base points: 50
  // Bonus based on quality:
  // - 90-100: +50 points (total: 100)
  // - 80-89: +40 points (total: 90)
  // - 70-79: +30 points (total: 80)
  // - 60-69: +20 points (total: 70)
  // - 50-59: +10 points (total: 60)
  // - Below 50: base only (total: 50)

  let points = 50; 

  if (aiScore >= 90) points += 50;
  else if (aiScore >= 80) points += 40;
  else if (aiScore >= 70) points += 30;
  else if (aiScore >= 60) points += 20;
  else if (aiScore >= 50) points += 10;

  return points;
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Upload endpoint - use POST to upload datasets',
    requiredFields: ['file', 'metadata']
  });
}