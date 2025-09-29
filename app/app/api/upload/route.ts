import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const researchField = formData.get('researchField') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const uniqueFilename = `${timestamp}-${randomId}${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadsDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://africaresearchbase.netlify.app' 
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    const fullUrl = `${baseUrl}${fileUrl}`;

    // Create file metadata
    const fileMetadata = {
      id: `file-${timestamp}-${randomId}`,
      originalName: file.name,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
      title,
      researchField,
      uploadedAt: new Date().toISOString(),
      url: fileUrl,
      fullUrl,
      downloadUrl: fullUrl, // This will be the download link
    };

    // Store metadata (you can save this to a database later)
    console.log('File uploaded:', fileMetadata);

    return NextResponse.json({
      success: true,
      file: fileMetadata,
      message: 'File uploaded successfully'
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
  return NextResponse.json({ message: 'Upload endpoint - use POST to upload files' });
}
