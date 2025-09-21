import React, { useState, useEffect } from 'react';

export function PaymentModal({
  datasetId,
  price,
  recipientAddress,
  onSuccess,
  onClose
}: {
  datasetId: string;
  price: number;
  recipientAddress: string;
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    const response = await fetch('/api/payment/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientAddress,
        amountSol: price / 1e9,
        label: 'Dataset Download',
        message: `Download dataset ${datasetId}`,
        reference: datasetId,
      }),
    });

    const data = await response.json();
    setQrCode(data.qrCode);
  };

  const handlePhantomPay = async () => {
    if (!window.solana) {
      alert('Please install Phantom wallet');
      return;
    }

    if (!window.solana.publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Connect wallet
      await window.solana.connect();

      // Create transaction
      const connection = new (window as any).solanaWeb3.Connection('https://api.devnet.solana.com');
      const transaction = new (window as any).solanaWeb3.Transaction().add(
        (window as any).solanaWeb3.SystemProgram.transfer({
          fromPubkey: window.solana.publicKey,
          toPubkey: new (window as any).solanaWeb3.PublicKey(recipientAddress),
          lamports: price,
        })
      );

      // Send transaction
      const signature = await window.solana.signAndSendTransaction(transaction);

      // Verify and download
      const response = await fetch(`/api/datasets/${datasetId}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionSignature: signature.signature,
          buyerAddress: window.solana.publicKey.toString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Convert base64 to blob and download
        const blob = new Blob([atob(data.fileData)]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        a.click();

        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
        
        <div className="text-center mb-4">
          <p className="mb-2">Amount: {price / 1e9} SOL</p>
          {qrCode && (
            <img src={qrCode} alt="Payment QR" className="mx-auto" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePhantomPay}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay with Phantom'}
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Scan QR with Solana Pay wallet or click "Pay with Phantom"
        </p>
      </div>
    </div>
  );
}