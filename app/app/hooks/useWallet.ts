"use client"

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.solana?.isPhantom) {
        // Check if already connected without prompting
        if (window.solana.isConnected && window.solana.publicKey) {
          setWalletState({
            connected: true,
            publicKey: window.solana.publicKey.toString(),
            balance: null // Would fetch actual balance in production
          });
        }
      }
    } catch (error) {
      // Wallet not connected or not available
      console.error('Wallet connection check failed:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.solana) {
      alert('Please install Phantom wallet!');
      return;
    }

    if (!window.solana.isPhantom) {
      alert('Please install Phantom wallet!');
      return;
    }

    setConnecting(true);
    try {
      const response = await window.solana.connect();
      setWalletState({
        connected: true,
        publicKey: response.publicKey.toString(),
        balance: null // Would fetch actual balance in production
      });
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
        setWalletState({
          connected: false,
          publicKey: null,
          balance: null
        });
      }
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  return {
    walletState,
    connecting,
    connectWallet,
    disconnectWallet
  };
}
