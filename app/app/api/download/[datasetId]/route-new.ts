import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory token storage (use Redis or database in production)
const downloadTokens = new Map<string, { datasetId: string; expiresAt: number }>();

export function storeDownloadToken(token: string, datasetId: string, expiryMinutes: number) {
  const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);
  downloadTokens.set(token, { datasetId, expiresAt });
}

function isValidToken(token: string, datasetId: string): boolean {
  const tokenData = downloadTokens.get(token);
  if (!tokenData) return false;
  if (tokenData.datasetId !== datasetId) return false;
  if (Date.now() > tokenData.expiresAt) {
    downloadTokens.delete(token);
    return false;
  }
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { datasetId: string } }
) {
  try {
    const { datasetId } = params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    // For development, allow downloads without token validation
    if (!token || token.startsWith('mock-token-')) {
      console.log('Development mode: allowing download without token validation');
    } else {
      // Validate token for production
      if (!isValidToken(token, datasetId)) {
        return NextResponse.json(
          { error: 'Invalid or expired download token' },
          { status: 403 }
        );
      }
    }

    // Generate sample dataset content based on datasetId
    const content = `# Africa Research Base Dataset
Dataset ID: ${datasetId}
Downloaded: ${new Date().toISOString()}

## About This Dataset
This is a sample research dataset from the Africa Research Base platform.

## Contents
- Research findings and analysis
- Data tables and visualizations  
- Methodology and sources
- Geographic scope: Africa
- Quality score: 85%

## Usage
This dataset is provided for research and educational purposes.
Please cite appropriately when using this data in your work.

## Contact
For questions about this dataset, please contact the contributor through the Africa Research Base platform.

---
Thank you for supporting African research!
Africa Research Base - Powered by Solana Blockchain
`;

    // Remove token after successful download (if it exists)
    if (token && !token.startsWith('mock-token-')) {
      downloadTokens.delete(token);
    }
    
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="africa-research-dataset-${datasetId}.txt"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
