// app/api/upload/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import { Groq } from 'groq-sdk';

// Initialize Groq AI client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// AI Verification with confidence scoring
async function verifyDatasetWithAI(
  fileContent: string,
  fileType: string,
  metadata: any
): Promise<{
  confidence: number;
  qualityScore: number;
  issues: string[];
  suggestions: string[];
  aiAnalysis: any;
}> {
  try {
    // Parse data based on file type
    let parsedData: any[] = [];
    let headers: string[] = [];

    if (fileType === 'csv') {
      const result = Papa.parse(fileContent, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });
      parsedData = result.data.slice(0, 100);
      headers = result.meta.fields || [];
    }

    // Calculate basic metrics
    const rowCount = parsedData.length;
    const colCount = headers.length;
    const missingPct =
      headers.reduce((acc, h) => {
        const colMissing = parsedData.filter((row) => !row[h]).length / rowCount;
        return acc + colMissing;
      }, 0) /
      colCount *
      100;

    // AI Analysis using Groq
    const sampleRows = JSON.stringify(parsedData.slice(0, 5));
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Analyze this research dataset and provide:
1. Confidence score (0-100) - how confident are you this is legitimate research data?
2. Quality score (0-100) - overall data quality
3. Issues found (array of problems)
4. Suggestions for improvement (array)
5. Brief analysis

Dataset Info:
- Title: ${metadata.title}
- Field: ${metadata.researchField}
- Headers: ${headers.join(', ')}
- Sample rows: ${sampleRows}
- Row count: ${rowCount}
- Missing data: ${missingPct.toFixed(2)}%

Return JSON only: {
  "confidence": number,
  "qualityScore": number,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "analysis": {
    "description": "brief summary",
    "dataTypes": ["type1", "type2"],
    "field": "verified field",
    "tags": ["tag1", "tag2"],
    "methodology": "detected methodology"
  }
}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    // Add additional validation
    const issues: string[] = aiResponse.issues || [];
    if (missingPct > 20) {
      issues.push(`High missing data: ${missingPct.toFixed(1)}%`);
    }
    if (rowCount < 10) {
      issues.push('Dataset too small (minimum 10 rows recommended)');
    }
    if (colCount > 100) {
      issues.push('Too many columns (maximum 100 recommended)');
    }

    return {
      confidence: Math.min(100, aiResponse.confidence || 50),
      qualityScore: Math.min(100, aiResponse.qualityScore || 50),
      issues,
      suggestions: aiResponse.suggestions || [],
      aiAnalysis: aiResponse.analysis || {},
    };
  } catch (error) {
    console.error('AI verification error:', error);
    return {
      confidence: 50,
      qualityScore: 50,
      issues: ['AI verification failed'],
      suggestions: ['Manual review recommended'],
      aiAnalysis: {},
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const researchField = formData.get('researchField') as string;
    const monetization = formData.get('monetization') as string;
    const price = formData.get('price') as string;

    // Validation
    if (!file || !title || !researchField) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // File validation
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and Excel files allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      );
    }

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileContent = buffer.toString();
    const fileType = file.name.endsWith('.csv') ? 'csv' : 'xlsx';

    // AI Verification
    const verification = await verifyDatasetWithAI(fileContent, fileType, {
      title,
      description,
      researchField,
    });

    // Require minimum confidence
    if (verification.confidence < 30) {
      return NextResponse.json(
        {
          error: 'Dataset verification failed',
          details: verification.issues,
          confidence: verification.confidence,
        },
        { status: 400 }
      );
    }

    // Store file in Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('datasets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to store file' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('datasets').getPublicUrl(fileName);

    // Create dataset record
    const { data: dataset, error: dbError } = await supabase
      .from('datasets')
      .insert({
        user_id: session.user.id,
        title,
        description: description || verification.aiAnalysis.description,
        research_field: researchField,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrl,
        file_type: fileType,
        ai_confidence: verification.confidence,
        ai_quality_score: verification.qualityScore,
        ai_issues: verification.issues,
        ai_suggestions: verification.suggestions,
        ai_metadata: verification.aiAnalysis,
        verification_status: 'pending_review',
        final_score: null,
        is_free: monetization === 'free',
        price_usd: monetization === 'paid' ? parseFloat(price) : 0,
        tags: verification.aiAnalysis.tags || [],
        status: 'active',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create dataset record' },
        { status: 500 }
      );
    }

    // Award upload points (50 base + quality bonus)
    const uploadPoints = 50 + Math.floor(verification.qualityScore / 10) * 10;
    await supabase.rpc('add_user_points', {
      p_user_id: session.user.id,
      p_points: uploadPoints,
      p_action: 'upload',
      p_description: `Uploaded: ${title}`,
    });

    return NextResponse.json({
      success: true,
      dataset,
      verification,
      pointsEarned: uploadPoints,
      message: 'Dataset uploaded successfully and pending review',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}