"use client"

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useState, useEffect, useCallback } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface EnhancedWalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  walletName: string | null;
}

export interface AvailableWallet {
  name: string;
  icon: string;
  installed: boolean;
  readyState: WalletReadyState;
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

  // Detect available wallets and auto-connect
  const detectAndConnect = useCallback(async () => {
    if (autoConnectAttempted || connected || connecting) return;
    
    setAutoConnectAttempted(true);
    
    // Check for various wallet providers
    const providers = [
      { name: 'Phantom', check: () => (window as any).phantom?.solana?.isPhantom },
      { name: 'Solflare', check: () => (window as any).solflare?.isSolflare },
      { name: 'Backpack', check: () => (window as any).backpack?.isBackpack },
      { name: 'Glow', check: () => (window as any).glowSolana?.isGlow },
      { name: 'Slope', check: () => (window as any).Slope },
      { name: 'Sollet', check: () => (window as any).sollet },
    ];

    for (const provider of providers) {
      if (provider.check()) {
        console.log(`${provider.name} wallet detected`);
        
        // Try to auto-connect if wallet was previously connected
        try {
          const walletProvider = getWalletProvider(provider.name);
          if (walletProvider?.isConnected) {
            console.log(`${provider.name} wallet already connected`);
            return;
          }
          
          // For Phantom, try silent connection
          if (provider.name === 'Phantom' && walletProvider?.connect) {
            try {
              const response = await walletProvider.connect({ onlyIfTrusted: true });
              if (response?.publicKey) {
                console.log(`Auto-connected to ${provider.name} wallet`);
                return;
              }
            } catch (error) {
              // Silent connection failed, that's okay
            }
          }
        } catch (error) {
          console.log(`Auto-connect failed for ${provider.name}:`, error);
        }
      }
    }
  }, [autoConnectAttempted, connected, connecting]);

  // Get wallet provider from window object
  const getWalletProvider = useCallback((walletName: string) => {
    const windowObj = window as any;
    switch (walletName.toLowerCase()) {
      case 'phantom':
        return windowObj.phantom?.solana;
      case 'solflare':
        return windowObj.solflare;
      case 'backpack':
        return windowObj.backpack;
      case 'glow':
        return windowObj.glowSolana;
      case 'slope':
        return windowObj.Slope;
      case 'sollet':
        return windowObj.sollet;
      default:
        return null;
    }
  }, []);

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

  // Get installed wallets
  const getInstalledWallets = useCallback((): AvailableWallet[] => {
    return wallets.map(w => ({
      name: w.adapter.name,
      icon: w.adapter.icon,
      installed: w.readyState === WalletReadyState.Installed,
      readyState: w.readyState
    }));
  }, [wallets]);

  // Effects
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  useEffect(() => {
    detectAndConnect();
  }, [detectAndConnect]);

  // Listen for account changes (with proper type safety)
  useEffect(() => {
    const handleAccountChanged = () => {
      fetchBalance();
    };

    // Listen to wallet adapter events
    if (wallet?.adapter) {
      wallet.adapter.on('connect', handleAccountChanged);
      wallet.adapter.on('disconnect', () => setBalance(null));
      
      return () => {
        wallet.adapter.off('connect', handleAccountChanged);
        wallet.adapter.off('disconnect', () => setBalance(null));
      };
    }

    // Also listen to direct wallet provider events if available
    const provider = getWalletProvider(wallet?.adapter.name || '');
    if (provider && typeof provider.on === 'function') {
      provider.on('accountChanged', handleAccountChanged);
      
      return () => {
        if (typeof provider.off === 'function') {
          provider.off('accountChanged', handleAccountChanged);
        }
      };
    }
  }, [fetchBalance, wallet, getWalletProvider]);

  return {
    walletState,
    connectWallet,
    disconnectWallet,
    selectWallet,
    fetchBalance,
    availableWallets: getInstalledWallets(),
    connection,
    // Additional utility functions
    isWalletInstalled: (walletName: string) => {
      const provider = getWalletProvider(walletName);
      return !!provider;
    },
    getWalletProvider
  };
}
