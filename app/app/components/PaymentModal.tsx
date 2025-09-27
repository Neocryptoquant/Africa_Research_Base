"use client"

import React from 'react';
import { X } from 'lucide-react';
import { SolanaPay } from './SolanaPay';

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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Payment Content */}
        <div className="p-6">
          <div className="mb-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Dataset Purchase
            </h3>
            <p className="text-gray-600">
              Dataset ID: {datasetId}
            </p>
          </div>

          <SolanaPay
            recipientAddress={recipientAddress}
            amount={price}
            reference={datasetId}
            label="Dataset Purchase"
            message={`Purchase dataset ${datasetId} from Africa Research Base`}
            onSuccess={() => {
              onSuccess?.();
              onClose?.();
            }}
            onError={(error: any) => {
              console.error('Payment error:', error);
              alert(`Payment failed: ${error}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
