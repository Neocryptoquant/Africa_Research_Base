import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize Solana connection
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

export async function POST(request: NextRequest) {
  try {
    const { signature, expectedAmount, recipientAddress, datasetId } = await request.json();

    if (!signature || !expectedAmount || !recipientAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify the transaction signature
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      return NextResponse.json(
        { error: 'Transaction failed' },
        { status: 400 }
      );
    }

    // Verify the recipient and amount
    const recipient = new PublicKey(recipientAddress);
    let paymentVerified = false;
    let actualAmount = 0;

    // Check post-token balances for the recipient
    if (transaction.meta?.postTokenBalances && transaction.meta?.preTokenBalances) {
      const postBalance = transaction.meta.postTokenBalances.find(
        balance => balance.owner === recipientAddress
      );
      const preBalance = transaction.meta.preTokenBalances.find(
        balance => balance.owner === recipientAddress
      );

      if (postBalance && preBalance) {
        actualAmount = (postBalance.uiTokenAmount?.uiAmount || 0) - (preBalance.uiTokenAmount?.uiAmount || 0);
        paymentVerified = actualAmount >= expectedAmount;
      }
    }

    // If token verification failed, check SOL transfer
    if (!paymentVerified && transaction.meta?.postBalances && transaction.meta?.preBalances) {
      // For versioned transactions, we'll use a simplified approach
      // Check if any account received the expected amount
      const balanceChanges = transaction.meta.postBalances.map((post, index) => 
        post - (transaction.meta?.preBalances?.[index] || 0)
      );
      
      const maxIncrease = Math.max(...balanceChanges);
      actualAmount = maxIncrease / 1e9; // Convert lamports to SOL
      paymentVerified = actualAmount >= (expectedAmount / 1e9); // Expected amount in lamports
    }

    if (!paymentVerified) {
      return NextResponse.json(
        { error: 'Payment amount verification failed' },
        { status: 400 }
      );
    }

    // Payment verified! Generate download access
    const downloadToken = generateDownloadToken(datasetId, signature);
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://africaresearchbase.netlify.app' 
      : 'http://localhost:3000';
    
    return NextResponse.json({
      success: true,
      verified: true,
      amount: actualAmount,
      downloadToken,
      downloadUrl: `${baseUrl}/api/download/${datasetId}?token=${downloadToken}`,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

function generateDownloadToken(datasetId: string, signature: string): string {
  // Generate a secure download token
  const crypto = require('crypto');
  const data = `${datasetId}-${signature}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function GET() {
  return NextResponse.json({ message: 'Payment verification endpoint - use POST to verify payments' });
}
