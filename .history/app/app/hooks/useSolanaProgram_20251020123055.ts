/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idlJson from "@/idl.json";

// ✅ Anchor Program ID
const PROGRAM_ID = new PublicKey("EAo3vy4cYj9ezXbkZRwWkhUnNCjiBcF2qp8vwXwNsPPD");

// ----------------------------------------------
// 🧠 INTERFACES
// ----------------------------------------------
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

// ----------------------------------------------
// ⚙️ MAIN HOOK
// ----------------------------------------------
export function useSolanaProgram() {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------
  // 🔧 PROGRAM SETUP
  // ----------------------------------------------
  const getProgram = useCallback((): Program<Idl> => {
    if (!publicKey || !signTransaction || !signAllTransactions) {
      throw new Error("Wallet not connected");
    }

    const provider = new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions } as any,
      { commitment: "confirmed" }
    );

    return new Program(idlJson as Idl, PROGRAM_ID, provider);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // ----------------------------------------------
  // 🔑 PDA HELPERS
  // ----------------------------------------------
  const findRegistryPDA = useCallback(() => {
    if (!publicKey) throw new Error("Wallet not connected");
    return PublicKey.findProgramAddressSync(
      [Buffer.from("registry"), publicKey.toBuffer()],
      PROGRAM_ID
    )[0];
  }, [publicKey]);

  const findReputationPDA = useCallback(() => {
    if (!publicKey) throw new Error("Wallet not connected");
    return PublicKey.findProgramAddressSync(
      [Buffer.from("reputation"), publicKey.toBuffer()],
      PROGRAM_ID
    )[0];
  }, [publicKey]);

  const findDatasetPDA = useCallback(
    (datasetCount: number) => {
      if (!publicKey) throw new Error("Wallet not connected");
      const counterBytes = Buffer.alloc(4);
      counterBytes.writeUInt32LE(datasetCount, 0);
      return PublicKey.findProgramAddressSync(
        [Buffer.from("dataset"), publicKey.toBuffer(), counterBytes],
        PROGRAM_ID
      )[0];
    },
    [publicKey]
  );

  // ----------------------------------------------
  // 🏗️ INITIALIZE REGISTRY
  // ----------------------------------------------
  const initializeRegistry = useCallback(async () => {
    if (!publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    setError(null);

    try {
      const program = getProgram();
      const registryPDA = findRegistryPDA();

      try {
        await program.account.registry.fetch(registryPDA);
        console.log("✅ Registry already initialized");
        return { success: true, pda: registryPDA.toBase58() };
      } catch {
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

        console.log("✅ Registry initialized:", tx);
        return { success: true, signature: tx, pda: registryPDA.toBase58() };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initialize registry";
      setError(msg);
      console.error("❌ Registry init error:", err);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [publicKey, getProgram, findRegistryPDA]);

  // ----------------------------------------------
  // ⭐ INITIALIZE REPUTATION
  // ----------------------------------------------
  const initializeReputation = useCallback(async () => {
    if (!publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    setError(null);

    try {
      const program = getProgram();
      const reputationPDA = findReputationPDA();

      try {
        await program.account.reputation.fetch(reputationPDA);
        console.log("✅ Reputation already initialized");
        return { success: true, pda: reputationPDA.toBase58() };
      } catch {
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

        console.log("✅ Reputation initialized:", tx);
        return { success: true, signature: tx, pda: reputationPDA.toBase58() };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to initialize reputation";
      setError(msg);
      console.error("❌ Reputation init error:", err);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [publicKey, getProgram, findReputationPDA]);

  // ----------------------------------------------
  // 🔢 GET DATASET COUNT
  // ----------------------------------------------
  const getDatasetCount = useCallback(async () => {
    if (!publicKey) return 0;

    try {
      const program = getProgram();
      const reputationPDA = findReputationPDA();
      const reputation = await program.account.reputation.fetch(reputationPDA);
      return (reputation.datasetCount as number) || 0;
    } catch {
      return 0;
    }
  }, [publicKey, getProgram, findReputationPDA]);

  // ----------------------------------------------
  // 🧬 CREATE DATASET
  // ----------------------------------------------
  const createDataset = useCallback(
    async (params: CreateDatasetParams) => {
      if (!publicKey) throw new Error("Wallet not connected");
      setLoading(true);
      setError(null);

      try {
        const program = getProgram();

        await initializeRegistry();
        await initializeReputation();

        const registryPDA = findRegistryPDA();
        const reputationPDA = findReputationPDA();
        const datasetCount = await getDatasetCount();
        const datasetPDA = findDatasetPDA(datasetCount);

        const compactMetadata = {
          t: params.aiMetadata.title.slice(0, 50),
          f: params.aiMetadata.researchField.slice(0, 20),
          s: params.aiMetadata.topics.slice(0, 3).map((t) => t.slice(0, 15)),
        };
        const metadataBuffer = Buffer.from(JSON.stringify(compactMetadata));

        const contentHashArray = Array.from(params.contentHash);
        if (contentHashArray.length !== 32) {
          throw new Error("Content hash must be exactly 32 bytes");
        }

        const dataUriBuffer = Buffer.from(params.dataUri);
        const dataUriArray = new Uint8Array(256);
        dataUriBuffer.copy(dataUriArray, 0, 0, Math.min(dataUriBuffer.length, 256));

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

        console.log("✅ Dataset created:", tx);

        return {
          success: true,
          signature: tx,
          datasetPDA: datasetPDA.toBase58(),
          datasetIndex: datasetCount,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create dataset";
        setError(msg);
        console.error("❌ Dataset creation error:", err);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [
      publicKey,
      getProgram,
      initializeRegistry,
      initializeReputation,
      findRegistryPDA,
      findReputationPDA,
      findDatasetPDA,
      getDatasetCount,
    ]
  );
  
  return {
    createDataset,
    initializeRegistry,
    initializeReputation,
    getDatasetCount,
    loading,
    error,
    isWalletConnected: !!publicKey,
  };
}
