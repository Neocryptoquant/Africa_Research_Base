"use client"

import { useState, useCallback } from 'react';
import { useEnhancedWallet } from './useEnhancedWallet';

export interface DatasetMetadata {
  title: string;
  description: string;
  researchField: string;
  topics: string[];
  methodology: string;
  geographicScope: string;
  timeframe: string;
  sampleSize?: number;
  wordCount: number;
  pageCount: number;
  language: string;
  dataTypes: string[];
}

export interface CreateDatasetParams {
  fileName: string;
  fileSize: number;
  contentHash: Uint8Array;
  aiMetadata: DatasetMetadata;
  dataUri: string;
  columnCount: number;
  rowCount: number;
  qualityScore: number;
}

export function useSimpleSolanaProgram() {
  const { walletState } = useEnhancedWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDataset = useCallback(async (params: CreateDatasetParams) => {
    if (!walletState.connected) {
      throw new Error('Please connect your wallet first');
    }

    setLoading(true);
    setError(null);

    try {
      // For now, simulate the on-chain transaction
      // In production, this would interact with the actual Solana program
      console.log('Creating dataset on-chain with params:', {
        fileName: params.fileName,
        fileSize: params.fileSize,
        qualityScore: params.qualityScore,
        wallet: walletState.publicKey
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Return simulated success response
      return {
        signature: `simulated_tx_${Date.now()}`,
        datasetPDA: `simulated_pda_${Date.now()}`,
        datasetIndex: Math.floor(Math.random() * 100)
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create dataset on-chain';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [walletState]);

  return {
    createDataset,
    loading,
    error,
    isWalletConnected: walletState.connected
  };
}
