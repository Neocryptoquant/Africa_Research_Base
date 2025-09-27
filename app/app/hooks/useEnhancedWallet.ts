"use client"

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
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect, 
    wallet,
    connect,
    wallets,
    select
  } = useWallet();
  const { setVisible } = useWalletModal();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);

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

  // Auto-detect and connect to available wallets
  const detectAndConnect = useCallback(async () => {
    if (autoConnectAttempted || connected || connecting) return;
    
    setAutoConnectAttempted(true);
    
    // Check if Phantom is available
    if (window.solana?.isPhantom) {
      try {
        // Try to connect silently if already authorized
        if (window.solana.isConnected) {
          console.log('Phantom wallet detected and already connected');
          return;
        }
        
        // Check if we have permission to connect
        const response = await window.solana.connect({ onlyIfTrusted: true });
        if (response.publicKey) {
          console.log('Auto-connected to Phantom wallet');
        }
      } catch (error) {
        console.log('Auto-connect failed, user needs to manually connect');
      }
    }
  }, [autoConnectAttempted, connected, connecting]);

  // Connect wallet with modal
  const connectWallet = useCallback(async () => {
    try {
      if (!wallet) {
        // Show wallet selection modal
        setVisible(true);
        return;
      }
      
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Show wallet selection modal on error
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

  // Select specific wallet
  const selectWallet = useCallback((walletName: string) => {
    const selectedWallet = wallets.find(w => w.adapter.name === walletName);
    if (selectedWallet) {
      select(selectedWallet.adapter.name);
    }
  }, [wallets, select]);

  // Effects
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    detectAndConnect();
  }, [detectAndConnect]);

  // Listen for account changes
  useEffect(() => {
    if (window.solana) {
      const handleAccountChanged = () => {
        fetchBalance();
      };

      window.solana.on?.('accountChanged', handleAccountChanged);
      
      return () => {
        window.solana.off?.('accountChanged', handleAccountChanged);
      };
    }
  }, [fetchBalance]);

  return {
    walletState,
    connectWallet,
    disconnectWallet,
    selectWallet,
    fetchBalance,
    availableWallets: wallets.map(w => ({
      name: w.adapter.name,
      icon: w.adapter.icon,
      installed: w.readyState === 'Installed'
    })),
    connection
  };
}

// Extend window interface for Phantom wallet
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      isConnected?: boolean;
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toBase58(): string } }>;
      disconnect: () => Promise<void>;
      on?: (event: string, callback: () => void) => void;
      off?: (event: string, callback: () => void) => void;
    };
  }
}
