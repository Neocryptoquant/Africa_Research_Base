// Payment QR Code Generator | Valid Endpoint!!!
// export const runtime = "node.js";

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const { recipientAddress, amountSol, reference, label, message } = await req.json();
    
    // Create Solana Pay URL
    let solanaUrl = `solana:${recipientAddress}`;
    const params = new URLSearchParams();
    
    if (amountSol && amountSol > 0) {
      params.append('amount', amountSol.toString());
    }
    if (reference) {
      params.append('reference', reference);
    }
    if (label) {
      params.append('label', label);
    }
    if (message) {
      params.append('message', message);
    }
    
    const queryString = params.toString();
    if (queryString) {
      solanaUrl += `?${queryString}`;
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(solanaUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      solanaPayUrl: solanaUrl
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate QR code' 
    }, { status: 500 });
  }
}