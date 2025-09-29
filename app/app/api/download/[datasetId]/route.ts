import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { getDownloadToken, deleteDownloadToken } from '@/app/lib/download-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const datasetId = (await params).datasetId;

    if (!token) {
      return NextResponse.json(
        { error: 'Download token required' },
        { status: 401 }
      );
    }

    // Verify download token (in production, check against database)
    const tokenData = getDownloadToken(token);
    if (!tokenData || tokenData.datasetId !== datasetId || tokenData.expiresAt < Date.now()) {
      return NextResponse.json(
        { error: 'Invalid or expired download token' },
        { status: 401 }
      );
    }

    // Find the file (in production, get file path from database)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // For demo purposes, we'll look for files matching the dataset ID pattern
    // In production, you'd store the exact file path in your database
    const files = await import('fs').then(fs => fs.readdirSync(uploadsDir));
    const matchingFile = files.find(file => file.includes(datasetId.split('-')[1]));

    if (!matchingFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const filePath = path.join(uploadsDir, matchingFile);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      );
    }

    // Read and return the file
    const fileBuffer = await readFile(filePath);
    const fileExtension = path.extname(matchingFile);
    
    // Set appropriate headers for file download
    const headers = new Headers();
    headers.set('Content-Type', getContentType(fileExtension));
    headers.set('Content-Disposition', `attachment; filename="${matchingFile}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    // Remove the token after use (one-time download)
    deleteDownloadToken(token);

    return new NextResponse(fileBuffer.toString(), { headers });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

function getContentType(extension: string): string {
  const contentTypes: { [key: string]: string } = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.json': 'application/json',
  };
  
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
}