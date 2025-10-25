"use client"

import { useState, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idlJson from '@/idl.json';

const PROGRAM_ID = new PublicKey('EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXwNsPPD');

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

export function useSolanaProgram() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProgram = useCallback(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      throw new Error('Wallet not connected');
    }

    const provider = new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: 'confirmed' }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(idlJson as any, provider);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const findRegistryPDA = useCallback(async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('registry'), publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, [publicKey]);

  const findReputationPDA = useCallback(async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('reputation'), publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, [publicKey]);

  const findDatasetPDA = useCallback(async (datasetCount: number) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const counterBytes = Buffer.alloc(4);
    counterBytes.writeUInt32LE(datasetCount, 0);
    
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('dataset'), publicKey.toBuffer(), counterBytes],
      PROGRAM_ID
    );
    return pda;
  }, [publicKey]);

  const initializeRegistry = useCallback(async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);

    try {
      const program = getProgram();
      const registryPDA = await findRegistryPDA();

      // Check if registry already exists
      try {
        await program.account.registry.fetch(registryPDA);
        console.log('Registry already initialized');
        return { success: true, pda: registryPDA.toBase58() };
      } catch {
        // Registry doesn't exist, initialize it
        const tx = await program.methods
          .initializeRegistry()
          .accounts({
            admin: publicKey,
            user: publicKey,
            contributor: publicKey,
            registry: registryPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Registry initialized:', tx);
        return { success: true, signature: tx, pda: registryPDA.toBase58() };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize registry';
      setError(errorMsg);
      console.error('Initialize registry error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [publicKey, getProgram, findRegistryPDA]);

  const initializeReputation = useCallback(async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    setLoading(true);
    setError(null);

    try {
      const program = getProgram();
      const reputationPDA = await findReputationPDA();

      // Check if reputation already exists
      try {
        await program.account.reputation.fetch(reputationPDA);
        console.log('Reputation already initialized');
        return { success: true, pda: reputationPDA.toBase58() };
      } catch {
        // Reputation doesn't exist, initialize it
        const tx = await program.methods
          .initializeReputation()
          .accounts({
            admin: publicKey,
            user: publicKey,
            contributor: publicKey,
            reputation: reputationPDA,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log('Reputation initialized:', tx);
        return { success: true, signature: tx, pda: reputationPDA.toBase58() };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize reputation';
      setError(errorMsg);
      console.error('Initialize reputation error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [publicKey, getProgram, findReputationPDA]);

  const getDatasetCount = useCallback(async () => {
    if (!publicKey) return 0;
    
    try {
      const program = getProgram();
      const reputationPDA = await findReputationPDA();
      const reputation = await program.account.reputation.fetch(reputationPDA);
      return reputation.datasetCount as number;
    } catch {
      return 0;
    }
  }, [publicKey, getProgram, findReputationPDA]);

  const createDataset = useCallback(async (params: CreateDatasetParams) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const program = getProgram();
      
      // Initialize registry and reputation if needed
      await initializeRegistry();
      await initializeReputation();

      const registryPDA = await findRegistryPDA();
      const reputationPDA = await findReputationPDA();
      
      // Get current dataset count
      const datasetCount = await getDatasetCount();
      const datasetPDA = await findDatasetPDA(datasetCount);

      // Prepare metadata (compact to avoid transaction size limits)
      const compactMetadata = {
        t: params.aiMetadata.title.slice(0, 50),
        f: params.aiMetadata.researchField.slice(0, 20),
        s: params.aiMetadata.topics.slice(0, 3).map(t => t.slice(0, 15))
      };
      const metadataBuffer = Buffer.from(JSON.stringify(compactMetadata));

      // Prepare content hash (32 bytes)
      const contentHashArray = Array.from(params.contentHash);
      if (contentHashArray.length !== 32) {
        throw new Error('Content hash must be exactly 32 bytes');
      }

      // Prepare data URI (256 bytes)
      const dataUriBuffer = Buffer.from(params.dataUri);
      const dataUriArray = new Uint8Array(256);
      dataUriBuffer.copy(dataUriArray, 0, 0, Math.min(dataUriBuffer.length, 256));

      // Create dataset transaction
      const tx = await program.methods
        .createDataset(
          contentHashArray,
          metadataBuffer,
          Buffer.from(params.fileName.slice(0, 100)),
          new BN(params.fileSize),
          Array.from(dataUriArray),
          new BN(params.columnCount),
          new BN(params.rowCount),
          Math.min(255, Math.max(0, Math.floor(params.qualityScore)))
        )
        .accounts({
          admin: publicKey,
          user: publicKey,
          contributor: publicKey,
          registry: registryPDA,
          dataset: datasetPDA,
          reputation: reputationPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Dataset created on-chain:', tx);
      
      return {
        success: true,
        signature: tx,
        datasetPDA: datasetPDA.toBase58(),
        datasetIndex: datasetCount
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create dataset';
      setError(errorMsg);
      console.error('Create dataset error:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [
    publicKey,
    getProgram,
    initializeRegistry,
    initializeReputation,
    findRegistryPDA,
    findReputationPDA,
    findDatasetPDA,
    getDatasetCount
  ]);

  return {
    createDataset,
    initializeRegistry,
    initializeReputation,
    getDatasetCount,
    loading,
    error,
    isWalletConnected: !!publicKey
  };
}