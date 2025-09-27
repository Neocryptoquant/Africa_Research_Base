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
        const recipient = new PublicKey(recipientAddress);
        const bigAmount = new BigNumber(amount);
        
        // Create a simple payment URL without reference for now
        // The reference should be a valid PublicKey, but we're getting a string
        const urlParams: TransactionRequestURL = {
          link: new URL(`solana:${recipientAddress}?amount=${amount}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`),
          label,
          message,
        };
        const url = encodeURL(urlParams);
        setPaymentUrl(url.toString());
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
      const recipient = new PublicKey(recipientAddress);
      const lamports = new BigNumber(amount).times(10 ** 9).toNumber();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'processed');
      onSuccess?.();
    } catch (error) {
      console.error('Direct payment error:', error);
      onError?.(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div ref={qrRef} className="p-4 bg-white rounded-lg shadow-md" />
      <p className="text-sm text-gray-500">Scan with a Solana Pay compatible wallet</p>

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
