"use client"

import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString(): string } }>;
      disconnect: () => Promise<void>;
      isConnected: boolean;
      publicKey: { toString(): string } | null;
      on?: (event: string, callback: () => void) => void;
      off?: (event: string, callback: () => void) => void;
    };
  }
}

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    balance: null
  });
  const [connecting, setConnecting] = useState(false);

  // Use devnet for development
  const connection = new Connection('https://api.devnet.solana.com');

  const updateWalletState = useCallback(async (publicKeyString: string | null) => {
    if (publicKeyString) {
      try {
        const publicKey = new PublicKey(publicKeyString);
        const balance = await connection.getBalance(publicKey);
        setWalletState({
          connected: true,
          publicKey: publicKeyString,
          balance: balance / LAMPORTS_PER_SOL
        });
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setWalletState({
          connected: true,
          publicKey: publicKeyString,
          balance: null
        });
      }
    } else {
      setWalletState({
        connected: false,
        publicKey: null,
        balance: null
      });
    }
  }, [connection]);

  useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      try {
        if (window.solana?.isPhantom) {
          if (window.solana.isConnected && window.solana.publicKey) {
            await updateWalletState(window.solana.publicKey.toString());
          }
        }
      } catch (error) {
        console.error('Wallet connection check failed:', error);
      }
    };

    checkIfWalletIsConnected();

    // Simplified event handling - will be handled by manual checks
  }, [updateWalletState]);

  const connectWallet = async () => {
    if (!window.solana) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    if (!window.solana.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const response = await window.solana.connect();
      await updateWalletState(response.publicKey.toString());
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana && window.solana.isConnected) {
        await window.solana.disconnect();
      }
      // Always update state to disconnected, even if wallet disconnect fails
      setWalletState({
        connected: false,
        publicKey: null,
        balance: null
      });
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      // Still update state to disconnected
      setWalletState({
        connected: false,
        publicKey: null,
        balance: null
      });
    }
  };

  return {
    walletState,
    connecting,
    connectWallet,
    disconnectWallet,
    connection
  };
}
