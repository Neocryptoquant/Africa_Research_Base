/* eslint-disable @typescript-eslint/no-explicit-any */
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

const POINTS_REWARDS = {
  BASE_UPLOAD: 50,
  QUALITY_90_PLUS: 100,
  QUALITY_80_89: 50,
  QUALITY_70_79: 25,
  LARGE_DATASET: 30,
  FIRST_UPLOAD: 50,
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

function calculatePoints(qualityScore: number, rowCount: number, isFirstUpload: boolean) {
  const breakdown: Record<string, number> = { base: POINTS_REWARDS.BASE_UPLOAD };
  if (qualityScore >= 90) breakdown.quality = POINTS_REWARDS.QUALITY_90_PLUS;
  else if (qualityScore >= 80) breakdown.quality = POINTS_REWARDS.QUALITY_80_89;
  else if (qualityScore >= 70) breakdown.quality = POINTS_REWARDS.QUALITY_70_79;
  if (rowCount >= 1000) breakdown.largeDataset = POINTS_REWARDS.LARGE_DATASET;
  if (isFirstUpload) breakdown.firstUpload = POINTS_REWARDS.FIRST_UPLOAD;
  const totalPoints = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { totalPoints, breakdown };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseServer!.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const researchField = formData.get('researchField') as string;

    if (!file || !title || !researchField)
      return NextResponse.json({ error: 'File, title, and research field required' }, { status: 400 });

    // Save locally
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.name).toLowerCase();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${timestamp}-${randomId}${ext}`);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    const fileUrl = `/uploads/${timestamp}-${randomId}${ext}`;
    const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${fileUrl}`;

    // Basic analysis (simplified)
    const analysis: AnalysisResult = {
      qualityScore: 80,
      description: description || 'Dataset for African research',
      tags: [researchField.toLowerCase(), 'africa'],
      dataTypes: ['research'],
      rowCount: 500,
      columnCount: 10,
      completeness: 80,
      consistency: 80,
    };

    // Check first upload
    const { count } = await supabaseServer!
      .from('datasets')
      .select('id', { count: 'exact', head: true })
      .eq('uploader_id', user.id);
    const isFirstUpload = (count || 0) === 0;

    // Calculate reward
    const pointsData = calculatePoints(analysis.qualityScore, analysis.rowCount, isFirstUpload);

    // Insert dataset
    const datasetId = `ds_${timestamp}_${randomId}`;
    const { data: dataset, error: insertError } = await supabaseServer!
      .from('datasets')
      .insert({
        id: datasetId,
        uploader_id: user.id,
        title,
        description,
        research_field: researchField,
        file_name: file.name,
        file_path: fileUrl,
        quality_score: analysis.qualityScore,
        ai_confidence_score: analysis.qualityScore,
        row_count: analysis.rowCount,
        column_count: analysis.columnCount,
        status: 'ai_verified',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Dataset insert error:', insertError);
      return NextResponse.json({ error: 'Dataset creation failed' }, { status: 500 });
    }

    // ✅ Award points through unified function
    const { error: rpcError } = await supabaseServer!.rpc('award_points', {
      user_id: user.id,
      points: pointsData.totalPoints,
      action: 'upload',
      description: `Uploaded dataset: ${title}`,
    });

    if (rpcError) console.error('Points reward error:', rpcError);

    // Fetch updated user
    const { data: profile } = await supabaseServer!
      .from('users')
      .select('total_points')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      dataset,
      rewards: {
        pointsEarned: pointsData.totalPoints,
        breakdown: pointsData.breakdown,
        newTotalPoints: profile?.total_points || 0,
      },
      message: `Upload successful! You earned ${pointsData.totalPoints} points!`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
