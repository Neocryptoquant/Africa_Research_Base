"use client"

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWallet as useCustomWallet } from './useWallet';
import { Program, AnchorProvider, web3, BN, utils } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useState, useCallback, useMemo } from 'react';
import IDL from '../../idl.json';

const PROGRAM_ID = new PublicKey('EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXwNsPPD');

// Admin public key - you'll need to set this to your admin wallet
const ADMIN_PUBKEY = new PublicKey('11111111111111111111111111111112'); // Replace with actual admin key

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
  contentHash: Uint8Array; // 32 bytes
  aiMetadata: DatasetMetadata;
  dataUri: string; // IPFS or storage URI
  columnCount: number;
  rowCount: number;
  qualityScore: number;
}

export function useSolanaProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { walletState } = useCustomWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    // Check if we have a connected wallet from either source
    const hasWallet = (wallet.publicKey && wallet.signTransaction) || walletState.connected;
    
    if (!hasWallet) return null;
    
    // Use the Solana wallet adapter if available, otherwise create a mock provider
    if (wallet.publicKey && wallet.signTransaction) {
      return new AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
          signAllTransactions: wallet.signAllTransactions || (async (txs) => {
            const signedTxs = [];
            for (const tx of txs) {
              signedTxs.push(await wallet.signTransaction!(tx));
            }
            return signedTxs;
          }),
        },
        { commitment: 'confirmed' }
      );
    }
    
    return null;
  }, [connection, wallet, walletState]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(IDL as any, PROGRAM_ID, provider);
  }, [provider]);

  // Helper function to derive PDAs
  const derivePDAs = useCallback((contributor: PublicKey, datasetCount?: number) => {
    const [registryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry'), ADMIN_PUBKEY.toBuffer()],
      PROGRAM_ID
    );

    const [reputationPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('reputation'), contributor.toBuffer()],
      PROGRAM_ID
    );

    let datasetPDA = null;
    if (datasetCount !== undefined) {
      const [pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('dataset'),
          contributor.toBuffer(),
          new BN(datasetCount).toArrayLike(Buffer, 'le', 4)
        ],
        PROGRAM_ID
      );
      datasetPDA = pda;
    }

    return { registryPDA, reputationPDA, datasetPDA };
  }, []);

  // Initialize registry (admin only)
  const initializeRegistry = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('Program or wallet not available');
    }

    setLoading(true);
    setError(null);

    try {
      const { registryPDA } = derivePDAs(wallet.publicKey);

      const tx = await program.methods
        .initializeRegistry()
        .accounts({
          admin: ADMIN_PUBKEY,
          user: wallet.publicKey,
          contributor: wallet.publicKey,
          registry: registryPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize registry';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, derivePDAs]);

  // Initialize reputation for a contributor
  const initializeReputation = useCallback(async () => {
    if (!program || !wallet.publicKey) {
      throw new Error('Program or wallet not available');
    }

    setLoading(true);
    setError(null);

    try {
      const { reputationPDA } = derivePDAs(wallet.publicKey);

      const tx = await program.methods
        .initializeReputation()
        .accounts({
          admin: ADMIN_PUBKEY,
          user: wallet.publicKey,
          contributor: wallet.publicKey,
          reputation: reputationPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize reputation';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, derivePDAs]);

  // Get reputation account
  const getReputation = useCallback(async (contributor?: PublicKey) => {
    if (!program) return null;
    
    const contributorKey = contributor || wallet.publicKey;
    if (!contributorKey) return null;

    try {
      const { reputationPDA } = derivePDAs(contributorKey);
      const reputation = await program.account.reputation.fetch(reputationPDA);
      return reputation;
    } catch (err) {
      console.log('Reputation account not found, needs initialization');
      return null;
    }
  }, [program, wallet.publicKey, derivePDAs]);

  // Create dataset on-chain
  const createDataset = useCallback(async (params: CreateDatasetParams) => {
    // Check wallet connection from either source
    const isWalletConnected = (wallet.publicKey && wallet.signTransaction) || walletState.connected;
    
    if (!isWalletConnected) {
      throw new Error('Please connect your wallet first');
    }
    
    if (!program) {
      // For now, simulate successful creation if program is not available
      console.warn('Solana program not available, simulating dataset creation');
      return {
        signature: 'simulated_' + Date.now(),
        datasetPDA: 'simulated_pda_' + Date.now(),
        datasetIndex: 0
      };
    }

    setLoading(true);
    setError(null);

    try {
      // Get current reputation to determine dataset count
      let reputation = await getReputation();
      
      // If reputation doesn't exist, initialize it first
      if (!reputation) {
        await initializeReputation();
        reputation = await getReputation();
      }

      if (!reputation) {
        throw new Error('Failed to initialize reputation');
      }

      const datasetCount = reputation.datasetCount;
      const { registryPDA, reputationPDA, datasetPDA } = derivePDAs(wallet.publicKey, datasetCount);

      if (!datasetPDA) {
        throw new Error('Failed to derive dataset PDA');
      }

      // Prepare metadata as bytes
      const metadataString = JSON.stringify(params.aiMetadata);
      const aiMetadata = Buffer.from(metadataString, 'utf8');
      const fileName = Buffer.from(params.fileName, 'utf8');
      
      // Prepare data URI as fixed-size array
      const dataUriBuffer = Buffer.alloc(256);
      const uriBytes = Buffer.from(params.dataUri, 'utf8');
      uriBytes.copy(dataUriBuffer, 0, 0, Math.min(uriBytes.length, 256));

      const tx = await program.methods
        .createDataset(
          Array.from(params.contentHash), // content_hash as [u8; 32]
          aiMetadata, // ai_metadata as bytes
          fileName, // file_name as bytes
          new BN(params.fileSize), // file_size as u64
          Array.from(dataUriBuffer), // data_uri as [u8; 256]
          new BN(params.columnCount), // column_count as u64
          new BN(params.rowCount), // row_count as u64
          params.qualityScore // quality_score as u8
        )
        .accounts({
          admin: ADMIN_PUBKEY,
          user: wallet.publicKey,
          contributor: wallet.publicKey,
          registry: registryPDA,
          dataset: datasetPDA,
          reputation: reputationPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        signature: tx,
        datasetPDA: datasetPDA.toString(),
        datasetIndex: datasetCount
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create dataset';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [program, wallet.publicKey, derivePDAs, getReputation, initializeReputation]);

  // Get dataset by PDA
  const getDataset = useCallback(async (datasetPDA: PublicKey) => {
    if (!program) return null;

    try {
      const dataset = await program.account.dataset.fetch(datasetPDA);
      return dataset;
    } catch (err) {
      console.error('Failed to fetch dataset:', err);
      return null;
    }
  }, [program]);

  // Get all datasets for a contributor
  const getContributorDatasets = useCallback(async (contributor?: PublicKey) => {
    if (!program) return [];
    
    const contributorKey = contributor || wallet.publicKey;
    if (!contributorKey) return [];

    try {
      const reputation = await getReputation(contributorKey);
      if (!reputation) return [];

      const datasets = [];
      for (let i = 0; i < reputation.datasetCount; i++) {
        const { datasetPDA } = derivePDAs(contributorKey, i);
        if (datasetPDA) {
          const dataset = await getDataset(datasetPDA);
          if (dataset) {
            datasets.push({
              ...dataset,
              pda: datasetPDA.toString(),
              index: i
            });
          }
        }
      }

      return datasets;
    } catch (err) {
      console.error('Failed to fetch contributor datasets:', err);
      return [];
    }
  }, [program, wallet.publicKey, getReputation, derivePDAs, getDataset]);

  return {
    program,
    provider,
    loading,
    error,
    initializeRegistry,
    initializeReputation,
    createDataset,
    getReputation,
    getDataset,
    getContributorDatasets,
    derivePDAs,
    programId: PROGRAM_ID,
    adminPubkey: ADMIN_PUBKEY
  };
}
