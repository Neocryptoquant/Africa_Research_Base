/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { read, utils } from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// AI Verification with Gemini
async function verifyDatasetWithGemini(
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
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const buffer = Buffer.from(fileContent, 'base64');
      const workbook = read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      headers = jsonData[0] || [];
      parsedData = jsonData.slice(1, 101).map(row =>
        headers.reduce((obj, h, i) => ({ ...obj, [h]: row[i] || null }), {})
      );
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

    // Gemini AI Analysis
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const sampleRows = JSON.stringify(parsedData.slice(0, 5));
    const prompt = `You are an expert research data analyst. Analyze this African research dataset and provide a comprehensive evaluation.

Dataset Information:
- Title: ${metadata.title}
- Research Field: ${metadata.researchField}
- Description: ${metadata.description || 'Not provided'}
- Column Headers: ${headers.join(', ')}
- Sample Data (first 5 rows): ${sampleRows}
- Total Rows: ${rowCount}
- Total Columns: ${colCount}
- Missing Data Percentage: ${missingPct.toFixed(2)}%

Please evaluate and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "confidence": <number 0-100>,
  "qualityScore": <number 0-100>,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "analysis": {
    "description": "brief summary of the dataset",
    "dataTypes": ["type1", "type2"],
    "field": "verified research field",
    "tags": ["tag1", "tag2", "tag3"],
    "methodology": "detected research methodology",
    "sampleSize": ${rowCount},
    "completeness": <number 0-100>,
    "consistency": <number 0-100>,
    "relevance": <number 0-100>
  }
}

Evaluation Criteria:
1. Confidence (0-100): How confident are you this is legitimate research data?
2. Quality Score (0-100): Overall data quality assessment
3. Issues: List specific problems found (missing data, inconsistencies, etc.)
4. Suggestions: Actionable recommendations for improvement
5. Analysis: Detailed metadata extraction

Consider African research context and standards.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }
    
    const aiResponse = JSON.parse(cleanedText);

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
    if (colCount < 2) {
      issues.push('Insufficient columns for meaningful analysis');
    }

    // Ensure scores are within range
    const confidence = Math.min(100, Math.max(0, aiResponse.confidence || 50));
    const qualityScore = Math.min(100, Math.max(0, aiResponse.qualityScore || 50));

    return {
      confidence,
      qualityScore,
      issues,
      suggestions: aiResponse.suggestions || ['Consider adding more detailed metadata'],
      aiAnalysis: {
        ...aiResponse.analysis,
        rowCount,
        colCount,
        missingDataPercentage: parseFloat(missingPct.toFixed(2)),
      },
    };
  } catch (error) {
    console.error('Gemini AI verification error:', error);
    return {
      confidence: 50,
      qualityScore: 50,
      issues: ['AI verification failed - manual review required'],
      suggestions: ['Ensure data is properly formatted', 'Check for data consistency'],
      aiAnalysis: {
        description: 'AI analysis unavailable',
        dataTypes: ['unknown'],
        field: 'other',
        tags: ['unverified'],
        methodology: 'unknown',
      },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
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
    const tags = formData.get('tags') as string; // comma-separated
    const contributorName = formData.get('contributorName') as string;
    const monetization = formData.get('monetization') as string;
    const price = formData.get('price') as string;

    // Validation
    if (!file || !title || !researchField) {
      return NextResponse.json(
        { error: 'Missing required fields: file, title, and researchField are required' },
        { status: 400 }
      );
    }

    // File validation
    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: CSV, PDF, ZIP, Excel files.' },
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
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    let fileContent = '';
    let fileType = '';
    
    // Only analyze CSV and Excel files with AI
    if (['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      fileContent = fileExtension === 'csv' ? buffer.toString() : buffer.toString('base64');
      fileType = fileExtension;
    }

    // AI Verification (only for CSV/Excel)
    let verification = {
      confidence: 70,
      qualityScore: 70,
      issues: [] as string[],
      suggestions: [] as string[],
      aiAnalysis: {
        description: description || 'Manual verification pending',
        dataTypes: ['document'],
        field: researchField,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        methodology: 'Not analyzed',
      },
    };

    if (fileType) {
      verification = await verifyDatasetWithGemini(fileContent, fileType, {
        title,
        description,
        researchField,
      });

      // Require minimum confidence for CSV/Excel
      if (verification.confidence < 30) {
        return NextResponse.json(
          {
            error: 'Dataset quality below minimum threshold',
            details: verification.issues,
            confidence: verification.confidence,
            suggestions: verification.suggestions,
          },
          { status: 400 }
        );
      }
    }

    // Store file in Supabase Storage
    const fileName = `${Date.now()}-${session.user.id}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('datasets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to store file: ' + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('datasets').getPublicUrl(fileName);

    // Parse tags
    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : verification.aiAnalysis.tags || [];

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
        file_type: file.type,
        ai_confidence: verification.confidence,
        ai_quality_score: verification.qualityScore,
        ai_issues: verification.issues,
        ai_suggestions: verification.suggestions,
        ai_metadata: verification.aiAnalysis,
        verification_status: 'pending_review',
        final_score: null,
        is_free: monetization === 'free',
        price_usd: monetization === 'paid' ? parseFloat(price) : 0,
        tags: tagArray,
        status: 'active',
        contributor_name: contributorName || session.user.email,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create dataset record: ' + dbError.message },
        { status: 500 }
      );
    }

    // Award upload points (50 base + quality bonus)
    const qualityBonus = Math.floor(verification.qualityScore / 10) * 10;
    const uploadPoints = 50 + qualityBonus;
    
    await supabase.rpc('add_user_points', {
      p_user_id: session.user.id,
      p_points: uploadPoints,
      p_action: 'upload',
      p_description: `Uploaded: ${title}`,
      p_reference_id: dataset.id,
    });

    return NextResponse.json({
      success: true,
      dataset,
      verification: {
        confidence: verification.confidence,
        qualityScore: verification.qualityScore,
        issues: verification.issues,
        suggestions: verification.suggestions,
      },
      pointsEarned: uploadPoints,
      message: 'Dataset uploaded successfully and pending peer review',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}