"use client";

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useCallback } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface EnhancedWalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  walletName: string | null;
}

export function useEnhancedWallet() {
  const { connection } = useConnection();
  const { publicKey, connected, connecting, disconnect, wallet, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);

  // Enhanced wallet state
  const walletState: EnhancedWalletState = {
    connected,
    connecting,
    publicKey: publicKey?.toBase58() || null,
    balance,
    walletName: wallet?.adapter.name || null
  };

  // Fetch balance when wallet connects
  const fetchBalance = useCallback(async () => {
    if (publicKey && connection) {
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(null);
      }
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  // Connect wallet with modal
  const connectWallet = useCallback(async () => {
    try {
      if (!wallet) {
        setVisible(true);
        return;
      }
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setVisible(true);
    }
  }, [wallet, connect, setVisible]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      setBalance(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, [disconnect]);

  // Effects
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    walletState,
    connectWallet,
    disconnectWallet,
    fetchBalance,
    connection
  };
}
