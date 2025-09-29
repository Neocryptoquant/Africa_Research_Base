"use client"

import React, { useEffect, useRef, useState } from 'react';
import { createQR, encodeURL, TransactionRequestURL } from '@solana/pay';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

interface SolanaPayProps {
  recipientAddress: string;
  amount: number;
  reference: string;
  label: string;
  message: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SolanaPay({ recipientAddress, amount, reference, label, message, onSuccess, onError }: SolanaPayProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // For Solflare and other wallets, just show the recipient address
        // This creates a simple QR code with just the wallet address
        setPaymentUrl(recipientAddress);
      } catch (error) {
        console.error('Error creating payment URL:', error);
        onError?.('Failed to create payment URL');
      }
    }
  }, [recipientAddress, amount, reference, label, message, onError]);

  useEffect(() => {
    if (paymentUrl && qrRef.current) {
      qrRef.current.innerHTML = '';
      const qr = createQR(paymentUrl, 300, 'transparent');
      qr.append(qrRef.current);
    }
  }, [paymentUrl]);

  const handleDirectPay = async () => {
    if (!publicKey) {
      onError?.('Wallet not connected');
      return;
    }

    try {
      // For development - simulate successful payment and provide download link
      console.log('Simulating payment for dataset:', reference);
      
      // Generate a mock download URL based on the dataset ID
      const downloadUrl = `https://africaresearchbase.netlify.app/api/download/${reference}?token=mock-token-${Date.now()}`;
      
      // Show success message
      alert(`Payment successful! Your dataset is ready for download.`);
      
      // Open download link in new tab
      window.open(downloadUrl, '_blank');
      
      onSuccess?.();
      
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div ref={qrRef} className="p-4 bg-white rounded-lg shadow-md" />
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Scan to get recipient address</p>
        <p className="text-xs text-gray-400">Amount: ${(amount / 1000000).toFixed(0)} USDC</p>
      </div>

      {publicKey && (
        <button
          onClick={handleDirectPay}
          className="w-full bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 disabled:bg-gray-400"
        >
          Pay with Connected Wallet
        </button>
      )}
    </div>
  );
}
