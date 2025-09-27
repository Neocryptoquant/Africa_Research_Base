"use client"

import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createQR, encodeURL, TransferRequestURLFields } from '@solana/pay';
import { BigNumber } from 'bignumber.js';
import { useWallet } from '../hooks/useWallet';

interface SolanaPayProps {
  recipientAddress: string;
  amount: number; // in lamports
  reference?: string;
  label?: string;
  message?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SolanaPay({
  recipientAddress,
  amount,
  reference,
  label = 'Dataset Purchase',
  message = 'Purchase dataset from Africa Research Base',
  onSuccess,
  onError
}: SolanaPayProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'error'>('pending');
  const { walletState, connection } = useWallet();

  useEffect(() => {
    generateQRCode();
  }, [recipientAddress, amount]);

  const generateQRCode = async () => {
    try {
      const recipient = new PublicKey(recipientAddress);
      const amountInSol = amount / LAMPORTS_PER_SOL;
      
      const urlParams: TransferRequestURLFields = {
        recipient,
        amount: new BigNumber(amountInSol),
        reference: reference ? [new PublicKey(reference)] : undefined,
        label,
        message,
      };

      const url = encodeURL(urlParams);
      const qr = createQR(url, 300, 'transparent');
      
      // Convert QR to data URL
      const canvas = document.createElement('canvas');
      qr.append(canvas);
      const dataUrl = canvas.toDataURL();
      setQrCode(dataUrl);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      onError?.('Failed to generate payment QR code');
    }
  };

  const processDirectPayment = async () => {
    if (!walletState.connected || !walletState.publicKey) {
      onError?.('Wallet not connected');
      return;
    }

    setPaymentStatus('processing');

    try {
      const fromPubkey = new PublicKey(walletState.publicKey);
      const toPubkey = new PublicKey(recipientAddress);

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: amount,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      // Sign and send transaction
      if (window.solana) {
        const signedTransaction = await window.solana.signAndSendTransaction(transaction);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signedTransaction.signature);
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed');
        }

        setPaymentStatus('completed');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      onError?.(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Solana Pay</h3>
        <p className="text-gray-600">
          Pay {(amount / LAMPORTS_PER_SOL).toFixed(4)} SOL
        </p>
      </div>

      {paymentStatus === 'pending' && (
        <div className="space-y-6">
          {/* QR Code Payment */}
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 mb-4">Scan with Solana Pay</h4>
            {qrCode && (
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <img src={qrCode} alt="Solana Pay QR Code" className="w-64 h-64" />
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Scan with any Solana Pay compatible wallet
            </p>
          </div>

          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Direct Payment */}
          <div className="text-center">
            <h4 className="font-semibold text-gray-800 mb-4">Pay with Connected Wallet</h4>
            {walletState.connected ? (
              <button
                onClick={processDirectPayment}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Pay Now
              </button>
            ) : (
              <p className="text-gray-500">Connect your wallet to pay directly</p>
            )}
          </div>
        </div>
      )}

      {paymentStatus === 'processing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      )}

      {paymentStatus === 'completed' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
          <p className="text-gray-600">Your transaction has been confirmed</p>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Payment Failed</h3>
          <p className="text-gray-600 mb-4">Please try again</p>
          <button
            onClick={() => setPaymentStatus('pending')}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
