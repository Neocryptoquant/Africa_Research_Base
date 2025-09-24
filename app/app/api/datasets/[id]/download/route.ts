// export const runtime = "edge"; // Comment out if needed
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    const { transactionSignature } = await req.json(); // Removed unused buyerAddress

    // Fetch dataset info
    const { data: dataset, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dataset) {
      return NextResponse.json({ 
        error: 'Dataset not found' 
      }, { status: 404 });
    }

    // For demo/hackathon, skip payment verification
    const skipPaymentForDemo = true;

    if (!skipPaymentForDemo && dataset.price_lamports > 0) {
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT!);
      
      try {
        const tx = await connection.getTransaction(transactionSignature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx || tx.meta?.err) {
          return NextResponse.json({ 
            error: 'Invalid payment transaction' 
          }, { status: 400 });
        }

        // Verify payment amount and recipient
        // This is simplified - in production, check the actual transfer instruction
        
      } catch (txError) {
        console.error('Transaction verification error:', txError); // Use txError
        return NextResponse.json({ 
          error: 'Payment verification failed' 
        }, { status: 400 });
      }
    }

    // Fetch file data
    const { data: fileData, error: fileError } = await supabase
      .from('dataset_files')
      .select('file_data')
      .eq('dataset_id', id)
      .single();

    if (fileError || !fileData) {
      return NextResponse.json({ 
        error: 'File not found' 
      }, { status: 404 });
    }

    // Update download count
    await supabase
      .from('datasets')
      .update({ 
        download_count: (dataset.download_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    // Return file data
    return NextResponse.json({
      success: true,
      fileName: dataset.file_name,
      fileData: fileData.file_data, // Base64 encoded
      dataset: {
        name: dataset.file_name,
        description: dataset.description,
        contributor: dataset.contributor_address,
        downloadCount: dataset.download_count + 1
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Download failed' 
    }, { status: 500 });
  }
}